// Generates the xr11 wordmark, app icons and tray states into assets/brand/.
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
mkdirSync(join(OUT, "tray"), { recursive: true });

function svg(viewBox, body, width, height) {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + viewBox + '"' +
    (width ? ' width="' + width + '" height="' + height + '"' : '') +
    ' fill="none">\n' + body + '\n</svg>\n';
}
const FONT = "SF Pro Rounded, SF Pro Display, -apple-system, BlinkMacSystemFont, system-ui, sans-serif";
function wordmark(size, baseline, mono) {
  const x = mono ? "currentColor" : "#62d0ff";
  const r = mono ? "currentColor" : "#f5f6fb";
  const one = mono ? "currentColor" : "#ffb454";
  return '<text x="50%" y="' + baseline + '" text-anchor="middle" font-family="' + FONT +
    '" font-size="' + size + '" font-weight="700" letter-spacing="-1.4">' +
    '<tspan fill="' + x + '">x</tspan><tspan fill="' + r + '">r</tspan>' +
    '<tspan fill="' + one + '">11</tspan></text>';
}

writeFileSync(join(OUT, "logo-mark.svg"), svg("0 0 64 64", '<title>xr11</title>' + wordmark(29, 43, false), 64, 64));
writeFileSync(join(OUT, "logo-mark-on-dark.svg"), svg("0 0 64 64", '<title>xr11</title>' + wordmark(29, 43, true), 64, 64));
writeFileSync(join(OUT, "logo-mark-mono.svg"), svg("0 0 64 64", '<title>xr11</title><g color="currentColor">' + wordmark(29, 43, true) + '</g>', 64, 64));
writeFileSync(join(OUT, "logo-wordmark-dark.svg"), svg("0 0 190 64", '<title>xr11</title>' + wordmark(42, 47, false), 190, 64));
writeFileSync(join(OUT, "logo-wordmark-light.svg"), svg("0 0 190 64", '<title>xr11</title><g color="#18213c">' + wordmark(42, 47, true) + '</g>', 190, 64));

const appIcon = '<title>xr11</title><rect x="40" y="40" width="944" height="944" rx="224" fill="#202544"/>' +
  wordmark(360, 600, false);
writeFileSync(join(OUT, "app-icon.svg"), svg("0 0 1024 1024", appIcon, 1024, 1024));

const smallIcon = '<title>xr11</title><rect x="1" y="1" width="30" height="30" rx="8" fill="#202544"/>' +
  wordmark(12.4, 20.7, false);
writeFileSync(join(OUT, "app-icon-small.svg"), svg("0 0 32 32", smallIcon, 32, 32));

// The menu bar uses a monochrome download glyph on macOS; other trays get a
// single-colour glyph and a state badge.
const GLYPH = '<path d="M7 1.5h2v5h3L8 11 4 6.5h3z" fill="{color}"/>' +
  '<path d="M3 14h10" stroke="{color}" stroke-width="1.6" stroke-linecap="round"/>';
const badges = {
  downloading: function (fg) { return '<path d="M12.5 10.4v4.1M10.9 13l1.6 1.6 1.6-1.6" stroke="' + fg + '" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>'; },
  paused: function (fg) { return '<path d="M11.6 10.9v3.2M13.4 10.9v3.2" stroke="' + fg + '" stroke-width="1.3" stroke-linecap="round"/>'; },
  error: function (fg) { return '<path d="M12.5 10.5v2.1" stroke="' + fg + '" stroke-width="1.4" stroke-linecap="round"/><circle cx="12.5" cy="14.3" r=".8" fill="' + fg + '"/>'; },
};
const palettes = {
  light: { glyph: "#fff", downloading: ["#6597ff", "#081225"], paused: ["#f1aa45", "#211506"], error: ["#ff6868", "#210707"] },
  dark: { glyph: "#1b1d24", downloading: ["#4f7ddd", "#fff"], paused: ["#b26b00", "#fff"], error: ["#d0343a", "#fff"] },
};
function trayIcon(state, theme) {
  const p = palettes[theme];
  const glyph = GLYPH.replaceAll("{color}", p.glyph);
  if (state === "idle") return svg("0 0 16 16", glyph, 16, 16);
  const colors = p[state];
  return svg("0 0 16 16",
    '<defs><mask id="cut"><rect width="16" height="16" fill="#fff"/><circle cx="12.5" cy="12.5" r="4.6" fill="#000"/></mask></defs>' +
    '<g mask="url(#cut)">' + glyph + '</g><circle cx="12.5" cy="12.5" r="3.5" fill="' + colors[0] + '"/>' +
    badges[state](colors[1]), 16, 16);
}
function trayTemplate(state) {
  const glyph = GLYPH.replaceAll("{color}", "#000");
  if (state === "idle") return svg("0 0 16 16", glyph, 16, 16);
  const knock = badges[state]("#000");
  return svg("0 0 16 16",
    '<defs><mask id="cut"><rect width="16" height="16" fill="#fff"/><circle cx="12.5" cy="12.5" r="4.6" fill="#000"/></mask>' +
    '<mask id="badge"><circle cx="12.5" cy="12.5" r="3.5" fill="#fff"/>' + knock + '</mask></defs>' +
    '<g mask="url(#cut)">' + glyph + '</g><rect width="16" height="16" fill="#000" mask="url(#badge)"/>', 16, 16);
}
for (const state of ["idle", "downloading", "paused", "error"]) {
  for (const theme of ["light", "dark"]) {
    writeFileSync(join(OUT, "tray", "tray-" + state + "-" + theme + ".svg"), trayIcon(state, theme));
  }
  writeFileSync(join(OUT, "tray", "tray-" + state + "-template.svg"), trayTemplate(state));
}
console.log("xr11 brand SVGs written");
