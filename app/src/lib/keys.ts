/**
 * Keyboard hints in the platform's own notation: ⌘/⇧ on macOS, Ctrl/Shift elsewhere.
 * Matching itself already accepts both Ctrl and Cmd (see MainWindow), this only fixes
 * what the UI prints.
 */
export const IS_MAC = typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);

export function kbd(keys: string): string {
  if (!IS_MAC) return keys;
  return keys
    .replace(/\bCtrl\b/g, "⌘")
    .replace(/\bShift\b/g, "⇧")
    .replace(/\bAlt\b/g, "⌥")
    .replace(/\bDelete\b/g, "⌫")
    .replace(/\bDel\b/g, "⌫");
}
