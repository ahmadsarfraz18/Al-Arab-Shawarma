// ---------------------------------------------------------------------------
// Theme Settings — DB-driven design tokens
//
// The ThemeSettings table (singleton, see prisma/schema.prisma) holds the five
// core brand colors. This module converts them into the runtime CSS custom
// properties used across the public site:
//
//   primaryColor   -> --brand
//   secondaryColor -> --gold
//   backgroundColor -> --background
//   textColor      -> --foreground
//   accentColor    -> --accent
//
// All other tokens (card, muted, border, ink, gradients, shadows, …) are
// DERIVED from those five values so the palette always stays harmonious.
//
// Every function here is pure and SSR-safe (no window/document access), so the
// same string can be injected server-side before first paint and hydrated
// client-side without mismatch.
// ---------------------------------------------------------------------------

export type ThemeTokens = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
};

// Safe hardcoded fallback — mirrors the existing styles.css :root palette and
// the current seed row. Used when the DB is unreachable or the row is missing.
export const FALLBACK_THEME: ThemeTokens = {
  primaryColor: "#39ff14",
  secondaryColor: "#7cff6b",
  accentColor: "#141a14",
  backgroundColor: "#0b0f0b",
  textColor: "#eaf5e7",
};

export type ThemePalette = {
  background: string;
  foreground: string;
  brand: string;
  brandForeground: string;
  gold: string;
  goldForeground: string;
  accent: string;
  accentForeground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
  ring: string;
  ink: string;
  cream: string;
};

type Rgb = [number, number, number];

const HEX_RE = /^#([0-9a-f]{6})$/i;

function parseHex(value: string): Rgb | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  const short = /^#([0-9a-f]{3})$/i.exec(trimmed);
  if (short) {
    const h = short[1];
    return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)];
  }
  const match = HEX_RE.exec(trimmed);
  if (!match) return null;
  return [
    parseInt(match[1].slice(0, 2), 16),
    parseInt(match[1].slice(2, 4), 16),
    parseInt(match[1].slice(4, 6), 16),
  ];
}

function toHex([r, g, b]: Rgb): string {
  const ch = (v: number) =>
    Math.round(Math.min(255, Math.max(0, v)))
      .toString(16)
      .padStart(2, "0");
  return `#${ch(r)}${ch(g)}${ch(b)}`;
}

function clampByte(v: number): number {
  return Math.min(255, Math.max(0, Math.round(v)));
}

// mix(a, b, t) -> color between a and b; t=0 -> a, t=1 -> b.
function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [
    clampByte(a[0] + (b[0] - a[0]) * t),
    clampByte(a[1] + (b[1] - a[1]) * t),
    clampByte(a[2] + (b[2] - a[2]) * t),
  ];
}

function rgba([r, g, b]: Rgb, alpha: number): string {
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// WCAG relative luminance, used to pick a readable foreground for a color.
function relativeLuminance([r, g, b]: Rgb): number {
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

// Dark ink for bright accents, light cream for dark surfaces — matches the
// existing brand/ink foreground choices.
function readableOn(color: Rgb): string {
  return relativeLuminance(color) >= 0.45 ? "#0b0f0b" : "#eaf5e7";
}

export function normalizeTheme(tokens: Partial<ThemeTokens> | null | undefined): ThemeTokens {
  const src = tokens && typeof tokens === "object" ? tokens : {};
  const pick = (value: string | undefined, fallback: string) => {
    const parsed = value === undefined ? null : parseHex(value);
    return parsed ? toHex(parsed) : fallback;
  };
  return {
    primaryColor: pick(src.primaryColor, FALLBACK_THEME.primaryColor),
    secondaryColor: pick(src.secondaryColor, FALLBACK_THEME.secondaryColor),
    accentColor: pick(src.accentColor, FALLBACK_THEME.accentColor),
    backgroundColor: pick(src.backgroundColor, FALLBACK_THEME.backgroundColor),
    textColor: pick(src.textColor, FALLBACK_THEME.textColor),
  };
}

export function derivePalette(theme: ThemeTokens): ThemePalette {
  const bg = parseHex(theme.backgroundColor) ?? parseHex(FALLBACK_THEME.backgroundColor)!;
  const fg = parseHex(theme.textColor) ?? parseHex(FALLBACK_THEME.textColor)!;
  const brand = parseHex(theme.primaryColor) ?? parseHex(FALLBACK_THEME.primaryColor)!;
  const gold = parseHex(theme.secondaryColor) ?? parseHex(FALLBACK_THEME.secondaryColor)!;
  const accent = parseHex(theme.accentColor) ?? mix(bg, fg, 0.07);

  const card = mix(bg, fg, 0.05);
  const muted = mix(bg, fg, 0.1);
  const mutedForeground = mix(bg, fg, 0.6);
  const ink = mix(bg, [0, 0, 0], 0.35);
  const cream = fg;
  const brandForeground = readableOn(brand);
  const goldForeground = readableOn(gold);
  const accentForeground = readableOn(accent);
  const ring = brand;

  return {
    background: toHex(bg),
    foreground: toHex(fg),
    brand: toHex(brand),
    brandForeground,
    gold: toHex(gold),
    goldForeground,
    accent: toHex(accent),
    accentForeground,
    card: toHex(card),
    cardForeground: toHex(fg),
    popover: toHex(card),
    popoverForeground: toHex(fg),
    primary: `var(--brand)`,
    primaryForeground: `var(--brand-foreground)`,
    secondary: toHex(card),
    secondaryForeground: toHex(fg),
    muted: toHex(muted),
    mutedForeground: toHex(mutedForeground),
    border: rgba(gold, 0.16),
    input: rgba(gold, 0.2),
    ring: toHex(ring),
    ink: toHex(ink),
    cream: toHex(cream),
  };
}

const FIXED_TOKENS = [
  "--radius: 0.75rem;",
  "--destructive: oklch(0.55 0.22 27);",
  "--destructive-foreground: oklch(0.99 0 0);",
  "--shadow-card: 0 8px 30px -12px rgba(0, 0, 0, 0.6);",
  "--whatsapp: oklch(0.62 0.17 145);",
];

// Builds the :root block that overrides the hardcoded styles.css palette with
// the DB theme. Deterministic — identical on the server and the client.
export function buildThemeCss(theme: ThemeTokens | null | undefined): string {
  const p = derivePalette(normalizeTheme(theme));
  const inkRgb = rgba(parseHex(p.ink) ?? [7, 10, 7], 0.35);
  const inkRgbStrong = rgba(parseHex(p.ink) ?? [7, 10, 7], 0.85);

  const lines = [
    `:root{`,
    `--background: ${p.background};`,
    `--foreground: ${p.foreground};`,
    `--card: ${p.card};`,
    `--card-foreground: ${p.cardForeground};`,
    `--popover: ${p.popover};`,
    `--popover-foreground: ${p.popoverForeground};`,
    `--brand: ${p.brand};`,
    `--brand-foreground: ${p.brandForeground};`,
    `--primary: ${p.primary};`,
    `--primary-foreground: ${p.primaryForeground};`,
    `--gold: ${p.gold};`,
    `--gold-foreground: ${p.goldForeground};`,
    `--secondary: ${p.secondary};`,
    `--secondary-foreground: ${p.secondaryForeground};`,
    `--muted: ${p.muted};`,
    `--muted-foreground: ${p.mutedForeground};`,
    `--accent: ${p.accent};`,
    `--accent-foreground: ${p.accentForeground};`,
    `--border: ${p.border};`,
    `--input: ${p.input};`,
    `--ring: ${p.ring};`,
    `--ink: ${p.ink};`,
    `--cream: ${p.cream};`,
    `--gradient-brand: linear-gradient(135deg, ${p.brand}, ${p.gold});`,
    `--gradient-gold: linear-gradient(135deg, ${toHex(mix(parseHex(p.gold) ?? [0, 0, 0], [255, 255, 255], 0.06))}, ${p.brand});`,
    `--gradient-hero: linear-gradient(180deg, ${inkRgb} 0%, ${inkRgbStrong} 100%);`,
    `--shadow-brand: 0 20px 60px -20px ${rgba(parseHex(p.brand) ?? [0, 0, 0], 0.35)};`,
    `--shadow-gold: 0 10px 40px -10px ${rgba(parseHex(p.brand) ?? [0, 0, 0], 0.45)};`,
    ...FIXED_TOKENS,
    `}`,
  ];

  return lines.join("\n");
}
