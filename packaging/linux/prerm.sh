#!/bin/sh
# xr11 pre-remove: delete the system-wide native messaging manifests.
for f in /etc/opt/chrome/native-messaging-hosts/com.xr11.host.json \
         /etc/chromium/native-messaging-hosts/com.xr11.host.json \
         /etc/opt/edge/native-messaging-hosts/com.xr11.host.json \
         /usr/lib/mozilla/native-messaging-hosts/com.xr11.host.json \
         /usr/lib64/mozilla/native-messaging-hosts/com.xr11.host.json; do
  rm -f "$f"
done
exit 0
