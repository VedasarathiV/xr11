# Publishing the xr11 website

The website source is in `site/`. The checked-in Pages workflow belongs to the upstream
`FortoGraphy/prism-download-manager` site, whose custom domain and badge data are configured
there. It is intentionally skipped in personal copies of this repository.

## Publish a separate site from this repository

If you want to publish this copy's `site/` folder, first replace the upstream `site/CNAME` with
your own domain (or remove it), then enable Pages as a repository administrator:

1. Open the repository's **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Add a workflow configured for this repository and domain, then run it.

GitHub's `actions/configure-pages` needs a separately authorized token to enable Pages
automatically; the default `GITHUB_TOKEN` can deploy after Pages is enabled, but cannot enable it.
Do not commit a token into the repository.

## Repository About details

The GitHub repository About panel is separate from files in this checkout and needs an
authenticated repository owner to edit. Suggested description:

> A free, open-source download manager for Windows, macOS, and Linux with browser capture, resumable transfers, video downloads, torrents, and AI model file downloads.

Suggested topics: `download-manager`, `rust`, `tauri`, `react`, `browser-extension`,
`video-downloader`, `bit-torrent`, `huggingface`.
