# Building xr11 on macOS

xr11 is a native Tauri app for macOS 11 and newer, on Apple Silicon and Intel. The `.app`
bundle carries the UI, Rust app, browser native-messaging helper, and Chromium/Firefox
extension builds. Once copied to Applications, it does not need the source project folder.
Settings, the extension copy, and managed tools live under `~/Library/Application Support/xr11`.

## 1. Prerequisites (macOS 11 Big Sur or newer; Apple Silicon or Intel)

```bash
xcode-select --install                       # Command Line Tools (clang, codesign, notarytool)
curl --proto '=https' -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"
rustup target add aarch64-apple-darwin x86_64-apple-darwin   # both, for a universal build
brew install node@24 ffmpeg                  # ffmpeg is optional but recommended
```

> ffmpeg: xr11 uses a system ffmpeg on macOS (there is no official checksummed static
> macOS build to auto-download). Without it, video muxing falls back to yt-dlp-only paths
> and HLS/DASH downloads keep `.ts`/`.m4s` output.

## 2. Build

```bash
git clone <repo> xr11 && cd xr11
npm ci --prefix app
npm ci --prefix extension
cd app
# Builds both browser extensions, the native helper, the UI, .app, and .dmg:
npm run tauri:build
# Or a universal binary:
node ../scripts/build-sidecar.mjs --target aarch64-apple-darwin
node ../scripts/build-sidecar.mjs --target x86_64-apple-darwin
lipo -create -output src-tauri/binaries/prism-native-host-universal-apple-darwin \
  src-tauri/binaries/prism-native-host-aarch64-apple-darwin \
  src-tauri/binaries/prism-native-host-x86_64-apple-darwin
npx tauri build --target universal-apple-darwin
```

Artifacts: `target/<target>/release/bundle/macos/xr11.app` and
`target/<target>/release/bundle/dmg/xr11_<version>_<arch>.dmg`.

## 3. What is macOS-specific (already implemented)

| Area | Implementation |
|---|---|
| App icon | `app/src-tauri/icons/icon.icns` (generated from `assets/brand/app-icon.svg`) |
| Tray | Template (monochrome) tray image `app/src-tauri/icons/tray/tray-idle-template.png`, menu-bar friendly |
| Window material | `window-vibrancy` `NSVisualEffectMaterial::UnderWindowBackground` (macOS 26 Liquid Glass is picked up automatically by the system material) |
| Power actions | `osascript` shut down, `pmset sleepnow`, `pmset displaysleepnow` (lock) |
| Keep awake while downloading | `caffeinate -i` child process |
| Autostart | LaunchAgent via `tauri-plugin-autostart` (`--background`) |
| Data directory | `~/Library/Application Support/xr11` |
| Native messaging | per-user manifests written by the app and by `prism-native-host register`: `~/Library/Application Support/Google/Chrome/NativeMessagingHosts`, `.../Chromium/...`, `.../Microsoft Edge/...`, `.../BraveSoftware/Brave-Browser/...`, `.../Vivaldi/...`, `~/Library/Application Support/Mozilla/NativeMessagingHosts` (Opera reads the Chrome location) |
| Host path | the host binary lives inside the bundle: `xr11.app/Contents/MacOS/prism-native-host`; it starts `Contents/MacOS/xr11 --background` when the app is not running |
| Entitlements | `packaging/macos/entitlements.plist` (hardened runtime, network client/server, user-selected + Downloads read/write). xr11 is intentionally **not sandboxed**: the App Sandbox blocks native messaging hosts and arbitrary download folders. |
| Wake timers | not supported (`pmset schedule` needs admin) — schedules run when the Mac is awake |

## 4. Install and first run

1. Open the DMG, drag `xr11.app` to Applications, then launch it from Applications or Launchpad.
2. In Settings → Browser integration, choose **Repair** and follow the browser's Load unpacked
   prompt. The app copies its bundled extension to Application Support; you do not need the
   build folder.
3. Settings → Video & streams → **Check tools** downloads yt-dlp and deno into Application
   Support when needed. ffmpeg uses the system installation.
4. Add a direct URL and confirm it downloads, pauses, and resumes from the app.

## 5. Signing and notarization (optional, for running without Gatekeeper warnings)

You need an Apple Developer account and a "Developer ID Application" certificate in your
login keychain.

```bash
export APPLE_SIGNING_IDENTITY="Developer ID Application: Your Name (TEAMID)"
export APPLE_ID="you@example.com"
export APPLE_PASSWORD="app-specific-password"     # appleid.apple.com → App-Specific Passwords
export APPLE_TEAM_ID="TEAMID"
cd app && npx tauri build --target universal-apple-darwin
```

Tauri signs the app (hardened runtime + the entitlements file referenced in
`tauri.conf.json` → `bundle.macOS.entitlements`), signs the `externalBin` sidecar, submits
to `notarytool` and staples the ticket. Verify:

```bash
codesign --verify --deep --strict --verbose=2 "target/universal-apple-darwin/release/bundle/macos/xr11.app"
spctl --assess --type execute --verbose "target/universal-apple-darwin/release/bundle/macos/xr11.app"
xcrun stapler validate "target/universal-apple-darwin/release/bundle/dmg/"*.dmg
```

Notes:
* The native messaging host is a separate executable inside the bundle; it must be signed
  too (Tauri does this for `externalBin`). Browsers launch it directly.
* yt-dlp / deno downloaded at runtime land in `~/Library/Application Support/xr11/tools`
  and are executed as child processes; Gatekeeper does not quarantine files written by the
  app itself, so no extra steps are needed.

## 6. CI

`.github/workflows/release.yml` builds `aarch64-apple-darwin` and `x86_64-apple-darwin`
DMGs on Apple Silicon runners (`macos-14`; the Intel build is cross-compiled). This already
works: the first run produced `xr11_1.0.0_aarch64.dmg` and `xr11_1.0.0_x64.dmg`.

Without signing secrets the app gets an **ad-hoc signature** (`bundle.macOS.signingIdentity
= "-"`), which Apple Silicon requires to launch at all. Gatekeeper still asks on first launch:
right-click `xr11.app` → **Open** (or `xattr -dr com.apple.quarantine /Applications/xr11.app`).
Add the `APPLE_*` secrets to the repository to get Developer-ID-signed, notarized DMGs.
