// -----------------------------------------------------------------------------
// Delivery areas — data + generic block-range/list matching (pure, no I/O).
//
// The checkout area picker matches user input against zone labels like
//   "Clifton Block 1-6", "Clifton Block 7,8,9", "Liaquatabad Block 1-4 & 10",
//   "Gulistan-e-Johar 1-13", "Federal B Area Block 11-22", "All Blocks", ...
//
// Matching is semantic, not substring-based:
//   - Numeric "block specs" (single, range, list, "&" mixes) are expanded into
//     sets of integers and matched by exact membership, so Block 10 never
//     matches "Block 1-6".
//   - Non-numeric text is matched case-insensitively, with spacing around
//     "-" / "," / "&" normalised, and the descriptor word "block(s)" treated
//     as optional so "Gulistan-e-Johar Block 5" matches "Gulistan-e-Johar 1-13".
// -----------------------------------------------------------------------------

export type Zone = { name: string; charge: number; areas: string[] };

export type DeliveryArea = {
  area: string;
  zone: string;
  charge: number;
};

export const ZONES: Zone[] = [
  {
    name: "Zone A",
    charge: 140,
    areas: [
      "Bahadurabad",
      "Sharfabad",
      "Dawood Society",
      "Kokan Society",
      "C.P Berar",
      "Dhoraji",
      "Darul Aman",
      "Hill Park",
      "Liaqat National",
      "Agha Khan",
    ],
  },
  {
    name: "Zone B",
    charge: 160,
    areas: [
      "P.E.C.H.S Block 2 & 3",
      "Ameer Khusro Road",
      "Chandni Chowk",
      "K.M.C.H.S",
      "Banglow Town A & B",
      "Shabbirabad",
      "Mohammad Ali Society",
      "Adamjee Nagar",
      "Miran Mohammad Shah Road",
      "K.D.A Scheme 1",
    ],
  },
  {
    name: "Zone C",
    charge: 200,
    areas: [
      "P.I.B",
      "Jamshed Road",
      "Khudadad Colony",
      "Muslimabad",
      "Amil Colony",
      "Gurumandir",
      "S.M.C.H.S Block A & B",
      "P.E.C.H.S Block 6",
      "K.E.C.H.S",
      "Falcon Complex",
      "Darwesh Colony",
      "Al Hilal Society",
    ],
  },
  {
    name: "Zone E",
    charge: 250,
    areas: [
      "Lasbela",
      "Garden East",
      "Soldier Bazar",
      "Parsi Colony",
      "Numaish",
      "Lines Area",
      "Jutt Line",
      "Abbesenia",
      "Jackab Line",
      "Jahangir Road",
      "Patel Para",
      "Purani Sabzi Mandi",
      "Gulshan Block 14-17",
      "K.D.A Officer Society",
      "D.O.H.S",
      "A.O.H.S",
      "Bahria University",
      "Liaquatabad Block 5-9",
      "Lalo Khet Daak Khana",
      "Teen Hatti",
      "Mahmoodabad",
      "Essa Nagri",
    ],
  },
  {
    name: "Zone F",
    charge: 350,
    areas: [
      "Liaquatabad Block 1-4 & 10",
      "Gulbahar Colony",
      "Old Rizvia Society",
      "Garden West",
      "Jinnah Hospital",
      "N.H.S",
      "Gulshan-e-Jamal",
      "Gulshan 18 & 19",
      "Qayyumabad",
      "Akhtar Colony",
      "Manzoor Colony",
      "DHA Phase 1 & 2",
    ],
  },
  {
    name: "Zone G",
    charge: 400,
    areas: [
      "Nazimabad All Blocks",
      "Paposh Nagar",
      "Pak Colony",
      "Gul Plaza",
      "Jama Cloth",
      "Saddar",
      "Regal",
      "Zainab Market",
      "Lucky Star",
      "DHA Phase 4",
      "Cantt Station",
      "Civil Line",
      "Faisal Base",
      "Askari 4",
      "Gulistan-e-Johar Block 14-20",
      "Gulshan Block 5-13",
    ],
  },
  {
    name: "Zone H",
    charge: 450,
    areas: [
      "Gulistan-e-Johar 1-13",
      "Gulshan Block 1,2,3",
      "Federal B Area Block 1-10",
      "North Nazimabad All Blocks",
      "I.I. Chundrigar Road",
      "DHA Phase 5 & 7",
      "Clifton Block 7,8,9",
    ],
  },
  {
    name: "Zone I",
    charge: 500,
    areas: [
      "Shadman Town",
      "Buffer Zone",
      "Federal B Area Block 11-22",
      "Gulshan Block 4",
      "Shah Faisal",
      "DHA Phase 6",
      "DHA Phase 8",
      "Clifton Block 1-6",
    ],
  },
];

export const ALL_AREAS: DeliveryArea[] = ZONES.flatMap((z) =>
  z.areas.map((area) => ({ area, zone: z.name, charge: z.charge })),
);

// Sentinel used when an area covers "All Blocks" (matches any block number).
export const ALL_BLOCKS = "ALL";
export type BlockSet = number[] | typeof ALL_BLOCKS;

const NUMBER_GROUP = /\d+(?:[-,&]\d+)*/g;
const MAX_RANGE_SPAN = 999;

export function normalizeAreaText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[–—−~]/g, "-")
    .replace(/[،]/g, ",")
    .replace(/\s+/g, " ")
    .replace(/\s*([-,&])\s*/g, "$1")
    .trim();
}

function expandGroup(group: string): number[] {
  const out = new Set<number>();
  for (const part of group.split("&")) {
    const range = part.match(/^(\d+)-(\d+)$/);
    if (range) {
      const a = Number(range[1]);
      const b = Number(range[2]);
      if (b < a || b - a > MAX_RANGE_SPAN) continue;
      for (let n = a; n <= b; n++) out.add(n);
    } else {
      for (const token of part.split(",")) {
        const n = Number(token);
        if (Number.isInteger(n) && n >= 0) out.add(n);
      }
    }
  }
  return [...out].sort((x, y) => x - y);
}

export type ParsedArea = {
  masked: string;
  blocks: BlockSet;
};

/**
 * Split an area label into:
 *  - `masked`: the label with every block spec (and the word "all" for
 *    "All Blocks" areas) replaced by the `#N#` marker, so a query's block
 *    numbers are treated as a wildcard for textual matching;
 *  - `blocks`: the exact set of block numbers covered, or `ALL_BLOCKS`.
 */
export function parseArea(label: string): ParsedArea {
  const normalized = normalizeAreaText(label);
  const allBlocks = /\ball\s+blocks?\b/.test(normalized);
  let masked = normalized.replace(/\bblocks?\b/g, " ").replace(NUMBER_GROUP, "#N#");
  if (allBlocks) masked = masked.replace(/\ball\b/g, "#N#");
  masked = masked.replace(/\s+/g, " ").trim();

  const groups = normalized.replace(/\bblocks?\b/g, " ").match(NUMBER_GROUP) ?? [];
  const blocks: BlockSet = allBlocks ? ALL_BLOCKS : groups.flatMap(expandGroup);

  return { masked, blocks };
}

function isEmptyBlocks(blocks: BlockSet): boolean {
  return blocks !== ALL_BLOCKS && blocks.length === 0;
}

function blocksOverlap(a: BlockSet, b: BlockSet): boolean {
  if (a === ALL_BLOCKS || b === ALL_BLOCKS) return true;
  return a.some((n) => b.includes(n));
}

/** Semantic match: does the delivery-area `label` cover the `query`? */
export function areaMatches(label: string, query: string): boolean {
  const q = normalizeAreaText(query);
  if (!q) return true;
  const parsedLabel = parseArea(label);
  const parsedQuery = parseArea(q);
  if (!parsedLabel.masked.includes(parsedQuery.masked)) return false;
  if (isEmptyBlocks(parsedQuery.blocks)) return true;
  return blocksOverlap(parsedLabel.blocks, parsedQuery.blocks);
}

/** Filter areas by query (empty query returns the first `limit` areas). */
export function filterAreas<T extends DeliveryArea>(areas: T[], query: string, limit = 8): T[] {
  const q = normalizeAreaText(query);
  if (!q) return areas.slice(0, limit);
  return areas.filter((a) => areaMatches(a.area, q)).slice(0, limit);
}

// -----------------------------------------------------------------------------
// Suggestions — present typed blocks resolved against their grouped range.
//
// The stored data keeps grouped labels only (e.g. "Clifton Block 1-6"). For the
// checkout picker we derive per-block labels on the fly so searching
// "Clifton Block 4" shows the block resolved to its zone/charge instead of only
// the grouped range label. No per-block database records are needed.
// -----------------------------------------------------------------------------

export type AreaSuggestion = {
  /** Canonical grouped area label (e.g. "Clifton Block 1-6"). */
  area: string;
  zone: string;
  charge: number;
  /** Display label — the resolved block(s) when the query names a block,
   *  otherwise the grouped area label (e.g. "Clifton Block 4"). */
  label: string;
};

/** Strip a trailing numeric block spec from an area label, preserving casing. */
function stripBlockSpec(label: string): string {
  return label.replace(/\s*\d+(?:\s*[-,&]\s*\d+)*\s*$/, "").trim();
}

/**
 * Build a suggestion for one matched area. When the query names block(s), the
 * label is the exact block the customer typed/resolved (e.g. "Clifton Block 4")
 * while `area` stays the grouped range used only internally for zone matching
 * (e.g. "Clifton Block 1-6").
 */
function suggestionForMatch(m: DeliveryArea, query: string): AreaSuggestion {
  const parsedQuery = parseArea(query);
  const queryBlocks = parsedQuery.blocks;
  const hasBlockSpec = queryBlocks !== ALL_BLOCKS && queryBlocks.length > 0;
  const spec = normalizeAreaText(query).match(/\d+(?:[-,&]\d+)*/)?.[0];
  const isAllBlocks = parseArea(m.area).blocks === ALL_BLOCKS;
  const label = hasBlockSpec && spec && !isAllBlocks ? `${stripBlockSpec(m.area)} ${spec}` : m.area;
  return { area: m.area, zone: m.zone, charge: m.charge, label };
}

/**
 * Return suggestions for the checkout picker. When the query names block(s),
 * each matched grouped area is surfaced under the typed block's label so
 * individual blocks resolve visibly (e.g. "Clifton Block 4" -> Zone I · Rs.500).
 */
export function suggestAreas<T extends DeliveryArea>(
  areas: T[],
  query: string,
  limit = 8,
): AreaSuggestion[] {
  return filterAreas(areas, query, limit).map((m) => suggestionForMatch(m, query));
}

/**
 * Resolve a typed query to exactly one delivery area. Returns the grouped area
 * (`area`) used only internally for zone/charge matching plus the customer-facing
 * `label` — the exact block the customer typed/resolved (e.g. "Gulshan Block 15"),
 * never the grouped range ("Gulshan Block 14-17").
 *
 * Returns `null` when the query matches nothing or more than one area, so an
 * ambiguous input (e.g. "Nazimabad Block 3" vs "North Nazimabad ...") is never
 * auto-assigned a wrong zone.
 */
export function resolveArea<T extends DeliveryArea>(
  areas: T[],
  query: string,
): AreaSuggestion | null {
  const matches = filterAreas(areas, query, areas.length);
  if (matches.length !== 1) return null;
  return suggestionForMatch(matches[0], query);
}
