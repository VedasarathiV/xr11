/** xr11 wordmark in a restrained three-colour palette inspired by macOS accents. */
export function LogoMark({ size = 22, glass = "steel" }: { size?: number; glass?: "white" | "steel" | "graphite" }) {
  const mono = glass !== "steel";
  const ink = glass === "white" ? "#ffffff" : "#7e8aa2";

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true" className="logo-mark">
      <text
        x="32"
        y="43"
        textAnchor="middle"
        fontFamily="SF Pro Rounded, SF Pro Display, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
        fontSize="29"
        fontWeight="700"
        letterSpacing="-1.4"
      >
        <tspan fill={mono ? ink : "#62d0ff"}>x</tspan>
        <tspan fill={mono ? ink : "#f5f6fb"}>r</tspan>
        <tspan fill={mono ? ink : "#ffb454"}>11</tspan>
      </text>
    </svg>
  );
}

/** The xr11 wordmark on a neutral tile that reads clearly in both app themes. */
export function BrandTile({ size = 28 }: { size?: number }) {
  return (
    <span className="brand-tile" style={{ width: size, height: size, borderRadius: Math.max(6, size * 0.26) }}>
      <LogoMark size={Math.round(size * 0.82)} />
    </span>
  );
}
