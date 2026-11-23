# xr11 project and component guide

xr11 is a cross-platform desktop download manager. It can accelerate and resume supported
downloads, capture links from a browser, download supported online media, manage BitTorrent
jobs, and fetch AI model files. It downloads model files; it does not run or train AI models.

## Main projects

| Folder or package | Description |
| --- | --- |
| `app/` | The desktop application: a React and TypeScript interface inside a Tauri shell. It contains the download list, settings, browser setup, model browser, queues, scheduler, and library tools. |
| `app/src-tauri/` (`prism-app`) | The Rust desktop entry point. It manages the native window, tray, operating-system integrations, sidecar processes, and app lifecycle. |
| `extension/` (`xr11-extension`) | Browser add-on for Chromium browsers and Firefox. It captures links and media actions and passes them to the installed xr11 app through native messaging. |
| `crates/prism-core/` | Application services and persistent state: download coordination, storage, categories, queues, scheduling, browser communication, video planning, and site grabbing. |
| `crates/prism-engine/` | The transfer engine for HTTP(S), FTP(S), HLS, and DASH. It handles parallel segments, resume, retries, and speed limits. |
| `crates/prism-native-host/` | Native messaging bridge between the browser extension and the desktop app, including browser registration and message framing. |
| `crates/prism-video/` | Video and audio discovery and download planning. It manages the supporting media tools used for supported sites and formats. |
| `crates/prism-torrent/` | BitTorrent and magnet-link support used by the app. |
| `crates/prism-testserver/` | Local test server that creates throttling, authentication, redirect, failure, and streaming fixtures for development. |

## Supporting folders

| Folder | Description |
| --- | --- |
| `site/` | Static product website, download pages, browser-extension guide, and feature pages. GitHub Pages publishes this folder. |
| `docs/` | Architecture, build, release, design, troubleshooting, and user-facing documentation. |
| `assets/brand/` | Source logos, application icons, tray artwork, and scripts used to generate brand images. |
| `packaging/linux/` | Linux application packaging and launch integration. |
| `packaging/macos/` | macOS app and disk-image packaging resources. |
| `packaging/windows/` | Windows installer and application packaging resources. |
| `scripts/` | Build helpers, platform smoke checks, release data, and repository maintenance scripts. |
| `site/mac/`, `site/windows/`, `site/linux/` | Platform-specific xr11 information and download pages. |
| `site/browser-extension/` | Instructions and information about the xr11 browser add-on. |
| `site/hugging-face/` | Product page describing AI model file downloads from Hugging Face. |
| `site/idm-alternative/` | Product information for people comparing xr11 with Internet Download Manager. |
| `site/tools/` | Website-only helpers and assets used while building or maintaining site pages. |
| `release/` | Local release output area and release instructions. Build outputs placed here are generated artifacts, not another source project. |
| `.github/workflows/` | GitHub Actions for CI, release builds, site deployment, and repository automation. |

## What the app is for

The main purpose is to manage files being downloaded on the computer. It is not a social or
camera app like Snapchat. The browser extension is an optional companion: after it is installed
and connected, it can send a browser download to xr11. AI model support organizes and downloads
model files from supported catalogs or direct file links; users need a separate runtime to use
those models.
