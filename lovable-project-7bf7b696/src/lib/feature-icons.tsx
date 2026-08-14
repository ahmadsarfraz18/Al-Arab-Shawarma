import {
  BadgeCheck,
  ChefHat,
  Gem,
  Leaf,
  ShieldCheck,
  Star,
  Tag,
  UtensilsCrossed,
  Zap,
  type LucideIcon,
} from "lucide-react";

// -----------------------------------------------------------------------------
// Feature icon catalog (Hero / About / Why-Us)
//
// Single source of truth for the iconKey values stored in hero_features,
// about_features and why_us_features. Mirrors the keys used by prisma/seed-data.ts
// and the "existing iconMap" on the public homepage (src/routes/index.tsx).
// -----------------------------------------------------------------------------

export const FEATURE_ICON_KEYS = [
  "leaf",
  "badge-check",
  "zap",
  "star",
  "utensils-crossed",
  "shield-check",
  "chef-hat",
  "gem",
  "tag",
] as const;

export type FeatureIconKey = (typeof FEATURE_ICON_KEYS)[number];

export const FEATURE_ICON_CATALOG: ReadonlyArray<{
  key: FeatureIconKey;
  label: string;
  Icon: LucideIcon;
}> = [
  { key: "leaf", label: "Leaf — fresh ingredients", Icon: Leaf },
  { key: "badge-check", label: "Badge check — halal / verified", Icon: BadgeCheck },
  { key: "zap", label: "Zap — fast delivery", Icon: Zap },
  { key: "star", label: "Star — authentic taste", Icon: Star },
  { key: "utensils-crossed", label: "Utensils — recipes / food", Icon: UtensilsCrossed },
  { key: "shield-check", label: "Shield check — hygienic", Icon: ShieldCheck },
  { key: "chef-hat", label: "Chef hat — chefs", Icon: ChefHat },
  { key: "gem", label: "Gem — premium quality", Icon: Gem },
  { key: "tag", label: "Tag — affordable prices", Icon: Tag },
];

const ICON_BY_KEY = new Map(FEATURE_ICON_CATALOG.map((i) => [i.key, i.Icon]));

export function FeatureIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_BY_KEY.get(name as FeatureIconKey);
  if (!Icon) return null;
  return <Icon className={className} />;
}
