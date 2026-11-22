# xr11 Drift Audit Registry

Audit snapshot: 2026-11-22. This workspace has no `.git` directory, so commit eras and
pre-existing diffs could not be reconstructed. Findings below are based on the current source
and the app, extension, and Rust test/build entry points.

## Findings

| Finding | Files | Type | Severity | Status |
|---|---|---|---|---|
| [AI model capture lost its category and folder during probing](#ai-model-capture-lost-its-category-and-folder-during-probing) | `HfModelsSheet.tsx`, `api.ts`, `commands.rs`, `capture.rs`, `manager.rs` | Capture flow drift | Moderate | Fixed |
| [AI model source strings drifted across locales](#ai-model-source-strings-drifted-across-locales) | `app/src/locales/*.json`, `HfModelsSheet.tsx` | Localization drift | Moderate | Fixed |
| [Category and branding tests retained old assumptions](#category-and-branding-tests-retained-old-assumptions) | `categories.rs`, `manager.rs`, `synthetic_hdr.json`, `plan.rs` | Test/doc drift | Low | Fixed |
| [Linux Firefox system manifest allowed only the legacy extension ID](#linux-firefox-system-manifest-allowed-only-the-legacy-extension-id) | `packaging/linux/postinst.sh`, `crates/prism-native-host/src/lib.rs` | Integration mismatch | Moderate | Fixed |
| [Linux package instructions and host location docs used stale names](#linux-package-instructions-and-host-location-docs-used-stale-names) | `BUILD.md`, `docs/guide/installation.md`, `crates/prism-native-host/README.md`, `main.rs`, crate metadata | Documentation drift | Low | Fixed |

## Eras

| Era | Evidence | Dominant pattern | Files |
|---|---|---|---|
| Current checkout | No Git metadata is present, so history is unavailable | React/Tauri frontend, Rust core, MV3 extension, native messaging host | `app/`, `crates/`, `extension/` |

## Responsibilities

| Responsibility | Implementations checked | Consistency |
|---|---|---|
| Hugging Face repository downloads | `HfModelsSheet.tsx` → `api.ts` → Tauri commands → `crates/prism-core/src/huggingface.rs` → manager queue | Consistent: repository files use pinned revisions, hashes, and the AI models category. |
| Direct model-file downloads | `HfModelsSheet.tsx` → `add_url` → `Core::capture` → capture dialog → manager | Fixed: explicit model category and configured Models folder now survive metadata probes. |
| Browser-to-app handoff | Extension manifests/protocol → `prism-native-host` → app IPC handler → Linux package post-install | Fixed: Chromium and Firefox builds use the xr11 name, shared `com.xr11.host` protocol, and manifests allow the current Firefox ID plus the prior ID for existing installs. |
| Localized app strings | `app/src/lib/i18n.ts` catalogs and `HfModelsSheet.tsx` | Fixed: all catalogs contain translated source-panel strings, and the obsolete queue string was removed. |
| Built-in category and test branding assumptions | `categories.rs`, Rust integration tests, `synthetic_hdr.json` | Fixed: tests now identify the `Other` category by ID and fixture branding matches xr11. |

## Risk Priority

### Critical

None found in the audited model-download and browser-integration paths.

### Moderate

No confirmed open defects after the fixes below. Kaggle and ModelScope repository browsing is not
built in: their source buttons open the provider, and xr11 accepts a direct file URL. Kaggle model
archives may require the user's Kaggle credentials; xr11 does not execute `ollama pull` or run
models.

### Cosmetic

Internal crate names, the extension's persisted `prism.state` key, and Firefox's `prism@...` ID
retain legacy names. They are implementation identities; changing them would require migration
or would break existing browser installations. The extension's user-facing manifest and UI use
the xr11 name.

## Verification Limits

- App tests/build, extension tests/build, and the full Rust workspace test suite passed.
- The browser E2E suite could not complete in this environment. Playwright's Chromium download
  made only partial progress, and the installed Chrome attempt timed out before its extension
  service worker appeared. E2E browser-to-host behavior therefore remains unverified here.
- Linux package post-install behavior was checked against the native-host ID configuration but was
  not executed against a Linux system installation.

## Finding Details

### AI model capture lost its category and folder during probing

- **Files:** `app/src/views/sheets/HfModelsSheet.tsx`, `app/src/lib/api.ts`,
  `app/src-tauri/src/commands.rs`, `crates/prism-core/src/manager/capture.rs`,
  `crates/prism-core/tests/manager.rs`
- **Type:** Capture flow drift; quantity/file-category handling.
- **Risk:** A direct model URL whose server returns a different filename (for example
  `pytorch_model.bin`) could be reclassified as a program, and the configured Models folder was
  not passed into the capture flow.
- **Severity:** Moderate; the file download could succeed in the wrong category/folder.
- **Status:** Fixed. `add_url` now accepts an optional save folder; the AI-model UI passes its
  configured Models folder; capture preserves caller-selected category and folder across probes.
- **Verification:** Added an integration regression case using a server-suggested `.bin` name and
  a custom Models folder.

### AI model source strings drifted across locales

- **Files:** `app/src/views/sheets/HfModelsSheet.tsx`, `app/src/locales/*.json`
- **Type:** Localization drift.
- **Risk:** The AI source panel failed the locale parity checks and showed incomplete translations.
- **Severity:** Moderate; feature text could be missing in supported languages.
- **Status:** Fixed. Added the nine source-panel keys to every catalog and removed the unused
  “Model files added to the Hugging Face queue” key.
- **Verification:** App locale tests pass.

### Category and branding tests retained old assumptions

- **Files:** `crates/prism-core/src/categories.rs`, `crates/prism-core/tests/manager.rs`,
  `crates/prism-video/tests/fixtures/synthetic_hdr.json`, `crates/prism-video/tests/plan.rs`
- **Type:** Test drift after adding the AI models category and rebranding the app.
- **Risk:** The suite failed even though runtime behavior matched the current category order and
  product name, obscuring real regressions.
- **Severity:** Low; test signal was stale.
- **Status:** Fixed. The category test now locates `Other` by ID, the queue assertion expects
  “AI models”, and the fixture uses “xr11 Test Channel”.
- **Verification:** Full Rust workspace passes.

### Linux Firefox system manifest allowed only the legacy extension ID

- **Files:** `packaging/linux/postinst.sh`, `crates/prism-native-host/src/lib.rs`
- **Type:** Browser integration mismatch.
- **Risk:** A system-wide native host manifest created by package installation did not list the
  current Firefox Add-ons ID (`prism@prismdl.site`), so the packaged host could reject the current
  xr11 extension in environments that use that manifest.
- **Severity:** Moderate; Firefox integration could appear disconnected on Linux packages.
- **Status:** Fixed. The package manifest now allows both the current extension ID and the legacy
  `prism@prism.dev` ID.
- **Verification:** Values match `firefox_extension_ids()` in the native host; native-host tests
  pass. The Linux package script itself was statically reviewed, not run against `/etc`.

### Linux package instructions and host location docs used stale names

- **Files:** `BUILD.md`, `docs/guide/installation.md`, `crates/prism-native-host/README.md`,
  `app/src-tauri/src/main.rs`, crate metadata
- **Type:** Documentation/configuration drift.
- **Risk:** Linux developers could try to launch or uninstall a `prism` executable/package even
  though current Tauri product metadata names it `xr11`; Windows/macOS host data paths were also
  documented as `Prism` while code uses `xr11`.
- **Severity:** Low; this affected setup guidance and metadata, not the compiled download flow.
- **Status:** Fixed. Build and uninstall instructions, path tables, comments, and package metadata
  now match the xr11 product configuration. The Linux user-data directory stays `prism` to retain
  existing app data compatibility.
- **Verification:** Cross-checked against `tauri.conf.json`, `crates/prism-core/src/paths.rs`, and
  `crates/prism-native-host/src/paths.rs`.
