xr11 browser extension
=======================

  Chrome / Edge / Brave / Opera / Vivaldi / Helium / Chromium
    Add it from the Chrome Web Store (it updates by itself):
    https://chromewebstore.google.com/detail/prism-download-manager/mmcdeiglkbfbicdjboocmhehodogilfl
    Click "Add to Chrome" (Brave: "Add to Brave"), then "Add extension".
    Added xr11 by hand before? Remove that copy on chrome://extensions first.

  Firefox / Zen (xr11 isn't in Firefox Add-ons yet)
    about:debugging#/runtime/this-firefox -> "Load Temporary Add-on" -> manifest.json
    in the `firefox` folder xr11 shows in Settings -> Browser integration:

      deb / rpm   /usr/lib/xr11/extension
      AppImage    ~/.local/share/prism/extension (xr11 copies it there: the AppImage's own
                  files move to a new place every time it starts)

    or xr11-firefox.zip from the release page, unzipped into a folder that stays.

xr11 registers its native messaging host automatically. Open xr11 -> Settings ->
Browser integration to check the status or repair it with one click.
