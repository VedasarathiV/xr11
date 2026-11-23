# Publishing the xr11 website

The website source is in `site/`. The workflow in
`.github/workflows/pages.yml` builds a Pages artifact from that folder and deploys it.

## Enable GitHub Pages

The workflow currently fails at `actions/configure-pages` if Pages has not been enabled for the
repository. Enable it once as a repository administrator:

1. Open the repository's **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Re-run the failed **Website (GitHub Pages)** workflow, or push a change under `site/`.

The workflow's `GITHUB_TOKEN` can deploy after Pages is enabled; it cannot enable Pages itself.
The `actions/configure-pages` action supports automatic enablement only when given a separate
token with repository Pages administration access. Do not commit a token into the repository.

## Repository About details

The GitHub repository About panel is separate from files in this checkout and needs an
authenticated repository owner to edit. Suggested description:

> A free, open-source download manager for Windows, macOS, and Linux with browser capture, resumable transfers, video downloads, torrents, and AI model file downloads.

Suggested topics: `download-manager`, `rust`, `tauri`, `react`, `browser-extension`,
`video-downloader`, `bit-torrent`, `huggingface`.
