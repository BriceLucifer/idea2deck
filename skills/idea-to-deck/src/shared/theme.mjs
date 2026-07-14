export const DEFAULT_THEME = Object.freeze({
  background: "F7F5F0",
  foreground: "171717",
  muted: "666666",
  accent: "315EFB",
  accent2: "FF6B4A",
  fontHeading: "Aptos Display",
  fontBody: "Aptos",
});

export function resolveTheme(theme = {}) {
  return { ...DEFAULT_THEME, ...theme };
}

export function cssColor(value, fallback = "#000000") {
  if (!value) return fallback;
  return value.startsWith("#") ? value : `#${value}`;
}

export function pptxColor(value, fallback = "000000") {
  if (!value) return fallback;
  return value.replace(/^#/, "").toUpperCase();
}
