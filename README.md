<p align="center">
  <img src="assets/brand/png/app-icon-256.png" width="120" alt="xr11">
</p>

<h1 align="center">xr11</h1>

<p align="center">
  <b>Every download, ruled.</b><br>
  A fast, open-source download manager for Windows, macOS and Linux, with browser capture,
  video downloads, torrents, queues, and AI model file downloads.
</p>

<p align="center">
  <img alt="Version 2.0" src="https://img.shields.io/badge/version-2.0.0-e8bb5c?style=flat-square">
  <a href="LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-2ecc71?style=flat-square"></a>
  <img alt="Platforms" src="https://img.shields.io/badge/Windows%20·%20macOS%20·%20Linux-555?style=flat-square">
</p>

---

xr11 splits every download into up to **32 parallel connections**, keeps them all busy until
the last byte, and survives crashes, sleep and pulled cables. Click a link in your browser and
xr11 takes over; grab videos as **MP4 in the quality you want — or just the MP3**.
The app uses a graphite interface with a system-blue accent and native macOS window controls.

Free, open source, no ads, no accounts, no telemetry.

## ✨ What's new in 2.0

The xr11 edition brings a clean typographic mark, a restrained macOS-inspired graphite and blue theme, and native macOS window chrome. The main download list, browser capture, media downloads, torrents, queues, schedules and library insights remain central to the app.

## ✨ Core features

| | |
|---|---|
| ⚡ **Up to 15× faster** | On servers that throttle each connection, the multi-connection engine is up to 15× faster than a normal browser download ([benchmarks](docs/benchmarks.md)). |
| 🔁 **Never start over** | Pause, close the laptop, lose power — xr11 resumes exactly where it stopped and checks that the file on the server hasn't changed. |
| 🌐 **Lives in your browser** | Chrome, Edge, Brave, Opera, Vivaldi and Firefox. Downloads jump into xr11 in about a quarter of a second. |
| 🎬 **Video & music** | YouTube and [1,800+ sites](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md): MP4 up to 8K/HDR or MP3 only, with subtitles, chapters and SponsorBlock. |
| 🧠 **AI model files** | Search Hugging Face in the app or paste direct file links from ModelScope, Kaggle or GitHub. Model weights are grouped under AI models; Ollama models use `ollama pull`. xr11 downloads files but does not run models. |
| 🧲 **Every protocol** | HTTP(S), FTP/FTPS, HLS and DASH streams, BitTorrent and magnet links. |
| 🗂 **Organised** | Categories, queues with schedules and speed limits, “shut down when done”, site grabber, batch downloads, clipboard monitor. |
| 🌍 **Your language** | English, Czech, German, Spanish, French, Italian, Indonesian, Turkish, Simplified Chinese and Arabic. |
| 🎨 **Yours** | Dark & light themes, system-blue accent, compact density and a mini window. |

## 🛠 Build from source

Requirements: Rust 1.88+, Node 20+, and the platform prerequisites in [BUILD.md](BUILD.md)
(Windows, Linux) or [docs/BUILD_MACOS.md](docs/BUILD_MACOS.md) (macOS).

```bash
npm ci --prefix app && npm ci --prefix extension
npm run tauri:build --prefix app
```

The macOS `.app` and `.dmg` include the native helper and browser extension builds. After
installing the app, its browser setup copies the extension and managed tools into your
macOS Application Support folder, so the app does not need the source project folder.

## Project layout

- `app/` — React desktop interface and Tauri application shell.
- `crates/` — Rust download engine, app services, browser messaging host, video and torrent backends, and local test server.
- `extension/` — Chromium and Firefox browser integration source, build scripts, and tests.
- `assets/` — xr11 brand artwork, icons, and generated image assets.
- `packaging/` — platform-specific installer and application packaging configuration.
- `scripts/` — build, release, smoke-check, and maintenance utilities.
- `site/` — public product website and platform/feature pages, published with GitHub Pages.
- `docs/` — architecture, build, release, user, and project documentation.
- `release/` — release instructions and locally generated release artifacts; generated binaries are not source files.
- `docs/PROJECTS.md` — plain-language descriptions of the app, crates, extension, website, and supporting folders.

The Pages workflow requires GitHub Pages to be enabled with **Settings → Pages → Build and deployment → Source: GitHub Actions**. See [docs/PUBLISHING.md](docs/PUBLISHING.md).

Frontend checks:

```bash
cd app && npm run typecheck && npm test && npm run build
```

## 🧠 How it works

* **Dynamic segmentation.** When a connection finishes its part, it takes over half of the
  largest part still remaining — so every connection stays busy until the very end.
* **Server-aware.** xr11 notices when a server refuses extra connections, settles on what it
  allows and remembers it per host.
* **Straight to disk.** Data is written directly into the final file (sparse on NTFS,
  pre-allocated on Linux) — no slow “assembling” step at the end.
* **Crash-safe.** Progress is checkpointed only after data is flushed to disk; on resume xr11
  validates size, ETag and Last-Modified with `If-Range`.
* **Rust + Tauri.** A Rust engine (tokio, rustls), a React UI in a native Tauri 2 shell — small,
  fast and memory-friendly.

Deep dive: [ARCHITECTURE.md](ARCHITECTURE.md).


## 📄 License

[MIT](LICENSE). Bundled and downloaded components keep their own licenses — see [THIRD_PARTY.md](THIRD_PARTY.md).
