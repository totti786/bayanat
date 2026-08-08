/** Generate a brand color scale (50–950) from a single accent hex. */
export function shadeScale(hex: string): Record<string, string> {
  const h = hex.replace("#", "");
  const base = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  const mix = (t: number, to: number[]) =>
    base.map((c, i) => Math.round(c * (1 - t) + to[i] * t));
  const rgb = (v: number[]) =>
    v.map((c) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, "0")).join("");

  const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  const out: Record<string, string> = {};
  for (const s of steps) {
    if (s < 500) {
      const t = (500 - s) / 450; // toward white
      out[String(s)] = "#" + rgb(mix(t, [255, 255, 255]));
    } else if (s > 500) {
      const t = (s - 500) / 450; // toward black
      out[String(s)] = "#" + rgb(mix(t, [8, 16, 16]));
    } else {
      out[String(s)] = hex.startsWith("#") ? hex : `#${hex}`;
    }
  }
  return out;
}

/** CSS that re-themes the app + PDFs from an accent color. */
export function themeCss(accent: string): string {
  const scale = shadeScale(accent);
  const vars = Object.entries(scale)
    .map(([step, value]) => `  --color-brand-${step}: ${value};`)
    .join("\n");
  return `:root {\n${vars}\n}`;
}
