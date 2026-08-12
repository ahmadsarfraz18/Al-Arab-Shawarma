import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  ALL_AREAS,
  ALL_BLOCKS,
  ZONES,
  areaMatches,
  filterAreas,
  normalizeAreaText,
  parseArea,
  resolveArea,
  suggestAreas,
} from "./delivery-areas";
import { buildOrderMessage } from "./order-message";
import { seedData } from "../../prisma/seed-data";

// Rebuild a "prefix + block" query for a single block inside a grouped label.
const queryForBlock = (areaLabel: string, block: number): string | null => {
  const n = normalizeAreaText(areaLabel);
  const specs = n.match(/\d+(?:[-,&]\d+)*/g);
  if (!specs) return null;
  const lastSpec = specs[specs.length - 1];
  const idx = n.lastIndexOf(lastSpec);
  return `${n.slice(0, idx).trim()} ${block}`;
};

describe("normalizeAreaText", () => {
  it("lowercases and trims", () => {
    assert.equal(normalizeAreaText("  CLIFTON BLOCK 5  "), "clifton block 5");
  });

  it("collapses spacing around - , &", () => {
    assert.equal(normalizeAreaText("Clifton Block 1 - 6"), "clifton block 1-6");
    assert.equal(normalizeAreaText("Clifton Block 7 , 8 , 9"), "clifton block 7,8,9");
    assert.equal(normalizeAreaText("DHA Phase 1 & 2"), "dha phase 1&2");
  });

  it("normalises unicode dashes", () => {
    assert.equal(normalizeAreaText("Gulistan-e-Johar Block 1–13"), "gulistan-e-johar block 1-13");
  });
});

describe("parseArea", () => {
  it("expands ranges", () => {
    assert.deepEqual(parseArea("Clifton Block 1-6").blocks, [1, 2, 3, 4, 5, 6]);
  });

  it("expands lists", () => {
    assert.deepEqual(parseArea("Clifton Block 7,8,9").blocks, [7, 8, 9]);
    assert.deepEqual(parseArea("Gulshan Block 1,2,3").blocks, [1, 2, 3]);
  });

  it("expands & mixes", () => {
    assert.deepEqual(parseArea("Liaquatabad Block 1-4 & 10").blocks, [1, 2, 3, 4, 10]);
    assert.deepEqual(parseArea("P.E.C.H.S Block 2 & 3").blocks, [2, 3]);
    assert.deepEqual(parseArea("DHA Phase 5 & 7").blocks, [5, 7]);
    assert.deepEqual(parseArea("Gulshan 18 & 19").blocks, [18, 19]);
  });

  it("parses single numbers", () => {
    assert.deepEqual(parseArea("Gulshan Block 4").blocks, [4]);
    assert.deepEqual(parseArea("Askari 4").blocks, [4]);
    assert.deepEqual(parseArea("K.D.A Scheme 1").blocks, [1]);
  });

  it("treats All Blocks as ALL", () => {
    assert.equal(parseArea("North Nazimabad All Blocks").blocks, ALL_BLOCKS);
    assert.equal(parseArea("Nazimabad All Blocks").blocks, ALL_BLOCKS);
  });

  it("masks block specs and All Blocks", () => {
    assert.equal(parseArea("Clifton Block 1-6").masked, "clifton #N#");
    assert.equal(parseArea("Gulistan-e-Johar 1-13").masked, "gulistan-e-johar #N#");
    assert.equal(parseArea("North Nazimabad All Blocks").masked, "north nazimabad #N#");
    assert.equal(parseArea("S.M.C.H.S Block A & B").masked, "s.m.c.h.s a&b");
  });

  it("leaves letter-only & pairs in the base text", () => {
    assert.deepEqual(parseArea("Banglow Town A & B").blocks, []);
    assert.equal(parseArea("Banglow Town A & B").masked, "banglow town a&b");
  });
});

describe("areaMatches — required behaviours", () => {
  it("Clifton Block 5 matches Clifton Block 1-6", () => {
    assert.equal(areaMatches("Clifton Block 1-6", "Clifton Block 5"), true);
  });

  it("Clifton Block 5 does not match Clifton Block 7,8,9", () => {
    assert.equal(areaMatches("Clifton Block 7,8,9", "Clifton Block 5"), false);
  });

  it("Clifton Block 7,8,9 covers 7, 8 and 9", () => {
    for (const block of ["7", "8", "9"]) {
      assert.equal(areaMatches("Clifton Block 7,8,9", `Clifton Block ${block}`), true);
    }
  });

  it("Liaquatabad Block 1-4 matches Liaquatabad Block 1-4 & 10", () => {
    assert.equal(areaMatches("Liaquatabad Block 1-4 & 10", "Liaquatabad Block 1-4"), true);
  });

  it("Gulistan-e-Johar Block 1-13 matches the label without the Block word", () => {
    assert.equal(areaMatches("Gulistan-e-Johar 1-13", "Gulistan-e-Johar Block 1-13"), true);
  });

  it("Federal B Area Block 1-10 covers 1..10 only", () => {
    assert.equal(areaMatches("Federal B Area Block 1-10", "Federal B Area Block 1"), true);
    assert.equal(areaMatches("Federal B Area Block 1-10", "Federal B Area Block 10"), true);
    assert.equal(areaMatches("Federal B Area Block 1-10", "Federal B Area Block 11"), false);
  });
});

describe("areaMatches — boundaries", () => {
  const clifton16 = "Clifton Block 1-6";

  it("matches range edges", () => {
    assert.equal(areaMatches(clifton16, "Clifton Block 1"), true);
    assert.equal(areaMatches(clifton16, "Clifton Block 6"), true);
  });

  it("rejects just outside the range", () => {
    assert.equal(areaMatches(clifton16, "Clifton Block 0"), false);
    assert.equal(areaMatches(clifton16, "Clifton Block 7"), false);
    assert.equal(areaMatches(clifton16, "Clifton Block 10"), false);
  });

  it("Clifton Block 10 must not match Clifton Block 1-6", () => {
    assert.equal(areaMatches(clifton16, "Clifton Block 10"), false);
  });

  it("does not cross area boundaries", () => {
    assert.equal(areaMatches("Gulshan Block 5-13", "Gulshan Block 4"), false);
    assert.equal(areaMatches("Gulshan Block 1,2,3", "Gulshan Block 4"), false);
    assert.equal(areaMatches("Gulistan-e-Johar Block 14-20", "Gulistan-e-Johar Block 13"), false);
    assert.equal(areaMatches("Federal B Area Block 11-22", "Federal B Area Block 10"), false);
  });
});

describe("areaMatches — case and spacing", () => {
  it("is case-insensitive", () => {
    assert.equal(areaMatches("Clifton Block 1-6", "clifton block 5"), true);
    assert.equal(areaMatches("Clifton Block 1-6", "CLIFTON BLOCK 5"), true);
  });

  it("tolerates loose spacing", () => {
    assert.equal(areaMatches("Clifton Block 1-6", "  Clifton   Block 5  "), true);
    assert.equal(areaMatches("Clifton Block 1-6", "Clifton Block 1 - 6"), true);
    assert.equal(areaMatches("Clifton Block 7,8,9", "Clifton Block 7 , 8 , 9"), true);
  });

  it("treats the Block word as optional in the query", () => {
    assert.equal(areaMatches("Gulistan-e-Johar 1-13", "Gulistan-e-Johar Block 5"), true);
    assert.equal(areaMatches("Gulistan-e-Johar 1-13", "Gulistan-e-Johar 5"), true);
    assert.equal(areaMatches("Clifton Block 1-6", "Clifton 5"), true);
  });
});

describe("areaMatches — All Blocks", () => {
  it("matches any block number", () => {
    assert.equal(areaMatches("North Nazimabad All Blocks", "North Nazimabad Block 5"), true);
    assert.equal(areaMatches("Nazimabad All Blocks", "Nazimabad Block 3"), true);
  });

  it("matches itself", () => {
    assert.equal(areaMatches("North Nazimabad All Blocks", "North Nazimabad All Blocks"), true);
  });
});

describe("areaMatches — non-matches", () => {
  it("does not match unrelated areas", () => {
    assert.equal(areaMatches("Shadman Town", "Clifton Block 5"), false);
    assert.equal(areaMatches("Bahadurabad", "Clifton Block 5"), false);
    assert.equal(areaMatches("Gulshan-e-Jamal", "Gulshan Block 4"), false);
    assert.equal(areaMatches("Shah Faisal", "Clifton"), false);
  });

  it("does not match nonsense", () => {
    assert.equal(areaMatches("Clifton Block 1-6", "Emaar"), false);
    assert.equal(areaMatches("Clifton Block 1-6", "K.A.D.A 12"), false);
  });

  it("blocks with letter suffixes are not numbers", () => {
    assert.equal(areaMatches("S.M.C.H.S Block A & B", "S.M.C.H.S Block B"), false);
  });
});

describe("whole dataset audit", () => {
  it("every area matches itself", () => {
    for (const a of ALL_AREAS) {
      assert.equal(
        areaMatches(a.area, a.area),
        true,
        `self-match failed for "${a.area}" (${a.zone})`,
      );
    }
  });

  it("every area parses without throwing", () => {
    for (const a of ALL_AREAS) {
      parseArea(a.area);
    }
  });

  it("audits the range/list areas in the dataset", () => {
    assert.equal(areaMatches("Clifton Block 1-6", "Clifton Block 5"), true);
    assert.equal(areaMatches("Clifton Block 7,8,9", "Clifton Block 9"), true);
    assert.equal(areaMatches("Liaquatabad Block 1-4 & 10", "Liaquatabad Block 10"), true);
    assert.equal(areaMatches("Liaquatabad Block 1-4 & 10", "Liaquatabad Block 5"), false);
    assert.equal(areaMatches("Liaquatabad Block 5-9", "Liaquatabad Block 5"), true);
    assert.equal(areaMatches("Liaquatabad Block 5-9", "Liaquatabad Block 10"), false);
    assert.equal(areaMatches("Gulistan-e-Johar 1-13", "Gulistan-e-Johar Block 13"), true);
    assert.equal(areaMatches("Gulistan-e-Johar Block 14-20", "Gulistan-e-Johar Block 20"), true);
    assert.equal(areaMatches("Federal B Area Block 1-10", "Federal B Area Block 5"), true);
    assert.equal(areaMatches("Federal B Area Block 11-22", "Federal B Area Block 22"), true);
    assert.equal(areaMatches("Gulshan Block 5-13", "Gulshan Block 13"), true);
    assert.equal(areaMatches("Gulshan Block 14-17", "Gulshan Block 17"), true);
    assert.equal(areaMatches("Gulshan 18 & 19", "Gulshan Block 18"), true);
    assert.equal(areaMatches("DHA Phase 5 & 7", "DHA Phase 5"), true);
    assert.equal(areaMatches("DHA Phase 5 & 7", "DHA Phase 7"), true);
    assert.equal(areaMatches("DHA Phase 5 & 7", "DHA Phase 4"), false);
  });
});

describe("checkout auto-resolve — unique single-match per typed block", () => {
  const cases: Array<[string, string, string, number]> = [
    ["Clifton Block 4", "Clifton Block 1-6", "Zone I", 500],
    ["Clifton Block 5", "Clifton Block 1-6", "Zone I", 500],
    ["Clifton Block 6", "Clifton Block 1-6", "Zone I", 500],
    ["Clifton Block 7", "Clifton Block 7,8,9", "Zone H", 450],
    ["Liaquatabad Block 4", "Liaquatabad Block 1-4 & 10", "Zone F", 350],
    ["Gulistan-e-Johar Block 13", "Gulistan-e-Johar 1-13", "Zone H", 450],
    ["Federal B Area Block 10", "Federal B Area Block 1-10", "Zone H", 450],
  ];

  for (const [query, area, zone, charge] of cases) {
    it(`${query} resolves uniquely to ${area} · ${zone} · Rs.${charge}`, () => {
      const result = filterAreas(ALL_AREAS, query);
      assert.equal(result.length, 1, `expected exactly one match for "${query}"`);
      assert.deepEqual(result[0], { area, zone, charge });
    });
  }
});

describe("filterAreas integration", () => {
  it("Clifton Block 5 resolves to Zone I Rs 500", () => {
    const result = filterAreas(ALL_AREAS, "Clifton Block 5");
    assert.deepEqual(result, [{ area: "Clifton Block 1-6", zone: "Zone I", charge: 500 }]);
  });

  it("Clifton Block 10 resolves to nothing", () => {
    assert.deepEqual(filterAreas(ALL_AREAS, "Clifton Block 10"), []);
  });

  it("Gulshan Block 4 resolves to only Gulshan Block 4 (Zone I)", () => {
    const result = filterAreas(ALL_AREAS, "Gulshan Block 4");
    assert.deepEqual(result, [{ area: "Gulshan Block 4", zone: "Zone I", charge: 500 }]);
  });

  it("Gulshan Block 10 resolves to only Gulshan Block 5-13 (Zone G)", () => {
    const result = filterAreas(ALL_AREAS, "Gulshan Block 10");
    assert.deepEqual(result, [{ area: "Gulshan Block 5-13", zone: "Zone G", charge: 400 }]);
  });

  it("Liaquatabad Block 1-4 resolves to Zone F only", () => {
    const result = filterAreas(ALL_AREAS, "Liaquatabad Block 1-4");
    assert.deepEqual(result, [{ area: "Liaquatabad Block 1-4 & 10", zone: "Zone F", charge: 350 }]);
  });

  it("Gulistan-e-Johar Block 15 resolves to Zone G only", () => {
    const result = filterAreas(ALL_AREAS, "Gulistan-e-Johar Block 15");
    assert.deepEqual(result, [
      { area: "Gulistan-e-Johar Block 14-20", zone: "Zone G", charge: 400 },
    ]);
  });

  it("Federal B Area Block 5 resolves to Zone H only", () => {
    const result = filterAreas(ALL_AREAS, "Federal B Area Block 5");
    assert.deepEqual(result, [{ area: "Federal B Area Block 1-10", zone: "Zone H", charge: 450 }]);
  });

  it("empty query returns the first areas, limited", () => {
    assert.equal(filterAreas(ALL_AREAS, "").length, 8);
    assert.equal(filterAreas(ALL_AREAS, "   ").length, 8);
  });

  it("covers every zone from the dataset", () => {
    assert.equal(ZONES.length, 8);
    const names = ZONES.map((z) => z.name);
    assert.deepEqual(names, [
      "Zone A",
      "Zone B",
      "Zone C",
      "Zone E",
      "Zone F",
      "Zone G",
      "Zone H",
      "Zone I",
    ]);
  });
});

describe("suggestAreas — individual blocks resolve visibly against grouped ranges", () => {
  const expect = (query: string, expected: Array<[string, string, string, number]>) => {
    const got = suggestAreas(ALL_AREAS, query, 8).map((s) => [s.label, s.area, s.zone, s.charge]);
    assert.deepEqual(got, expected, `suggestAreas("${query}")`);
  };

  it("Clifton 1-6 range", () => {
    expect("Clifton Block 4", [["Clifton Block 4", "Clifton Block 1-6", "Zone I", 500]]);
    expect("Clifton Block 5", [["Clifton Block 5", "Clifton Block 1-6", "Zone I", 500]]);
    expect("Clifton Block 6", [["Clifton Block 6", "Clifton Block 1-6", "Zone I", 500]]);
    expect("Clifton Block 1", [["Clifton Block 1", "Clifton Block 1-6", "Zone I", 500]]);
    expect("Clifton Block 2-4", [["Clifton Block 2-4", "Clifton Block 1-6", "Zone I", 500]]);
  });

  it("Clifton 7,8,9 list", () => {
    expect("Clifton Block 7", [["Clifton Block 7", "Clifton Block 7,8,9", "Zone H", 450]]);
    expect("Clifton Block 8", [["Clifton Block 8", "Clifton Block 7,8,9", "Zone H", 450]]);
    expect("Clifton Block 9", [["Clifton Block 9", "Clifton Block 7,8,9", "Zone H", 450]]);
  });

  it("Liaquatabad 1-4 & 10 mixed format", () => {
    expect("Liaquatabad Block 4", [
      ["Liaquatabad Block 4", "Liaquatabad Block 1-4 & 10", "Zone F", 350],
    ]);
    expect("Liaquatabad Block 10", [
      ["Liaquatabad Block 10", "Liaquatabad Block 1-4 & 10", "Zone F", 350],
    ]);
    expect("Liaquatabad Block 1-4", [
      ["Liaquatabad Block 1-4", "Liaquatabad Block 1-4 & 10", "Zone F", 350],
    ]);
  });

  it("Liaquatabad 5-9 crosses into Zone E", () => {
    expect("Liaquatabad Block 5", [
      ["Liaquatabad Block 5", "Liaquatabad Block 5-9", "Zone E", 250],
    ]);
    expect("Liaquatabad Block 9", [
      ["Liaquatabad Block 9", "Liaquatabad Block 5-9", "Zone E", 250],
    ]);
  });

  it("Gulistan-e-Johar 1-13 and 14-20 boundaries", () => {
    expect("Gulistan-e-Johar Block 13", [
      ["Gulistan-e-Johar 13", "Gulistan-e-Johar 1-13", "Zone H", 450],
    ]);
    expect("Gulistan-e-Johar Block 14", [
      ["Gulistan-e-Johar Block 14", "Gulistan-e-Johar Block 14-20", "Zone G", 400],
    ]);
    expect("Gulistan-e-Johar Block 20", [
      ["Gulistan-e-Johar Block 20", "Gulistan-e-Johar Block 14-20", "Zone G", 400],
    ]);
  });

  it("Federal B Area 1-10 and 11-22 boundaries", () => {
    expect("Federal B Area Block 10", [
      ["Federal B Area Block 10", "Federal B Area Block 1-10", "Zone H", 450],
    ]);
    expect("Federal B Area Block 11", [
      ["Federal B Area Block 11", "Federal B Area Block 11-22", "Zone I", 500],
    ]);
    expect("Federal B Area Block 22", [
      ["Federal B Area Block 22", "Federal B Area Block 11-22", "Zone I", 500],
    ]);
  });

  it("Gulshan split across zones", () => {
    expect("Gulshan Block 4", [["Gulshan Block 4", "Gulshan Block 4", "Zone I", 500]]);
    expect("Gulshan Block 10", [["Gulshan Block 10", "Gulshan Block 5-13", "Zone G", 400]]);
    expect("Gulshan Block 13", [["Gulshan Block 13", "Gulshan Block 5-13", "Zone G", 400]]);
    expect("Gulshan Block 1,2,3", [["Gulshan Block 1,2,3", "Gulshan Block 1,2,3", "Zone H", 450]]);
  });

  it("All Blocks areas keep their grouped label", () => {
    expect("North Nazimabad Block 5", [
      ["North Nazimabad All Blocks", "North Nazimabad All Blocks", "Zone H", 450],
    ]);
  });

  it("'Nazimabad' is genuinely ambiguous with 'North Nazimabad' — both shown", () => {
    expect("Nazimabad Block 3", [
      ["Nazimabad All Blocks", "Nazimabad All Blocks", "Zone G", 400],
      ["North Nazimabad All Blocks", "North Nazimabad All Blocks", "Zone H", 450],
    ]);
  });

  it("partial queries keep grouped labels", () => {
    const got = suggestAreas(ALL_AREAS, "Clifton", 8).map((s) => [
      s.label,
      s.area,
      s.zone,
      s.charge,
    ]);
    assert.deepEqual(got, [
      ["Clifton Block 7,8,9", "Clifton Block 7,8,9", "Zone H", 450],
      ["Clifton Block 1-6", "Clifton Block 1-6", "Zone I", 500],
    ]);
  });

  it("non-block areas resolve as themselves", () => {
    expect("Bahadurabad", [["Bahadurabad", "Bahadurabad", "Zone A", 140]]);
    expect("P.E.C.H.S Block 2", [["P.E.C.H.S Block 2", "P.E.C.H.S Block 2 & 3", "Zone B", 160]]);
    expect("DHA Phase 5", [["DHA Phase 5", "DHA Phase 5 & 7", "Zone H", 450]]);
    expect("Gulshan 18", [["Gulshan 18", "Gulshan 18 & 19", "Zone F", 350]]);
  });

  it("blocks outside any range resolve to nothing", () => {
    assert.deepEqual(suggestAreas(ALL_AREAS, "Clifton Block 10", 8), []);
    assert.deepEqual(suggestAreas(ALL_AREAS, "Federal B Area Block 23", 8), []);
    assert.deepEqual(suggestAreas(ALL_AREAS, "Liaquatabad Block 11", 8), []);
    assert.deepEqual(suggestAreas(ALL_AREAS, "Gulshan Block 21", 8), []);
  });
});

describe("exhaustive block audit — every block in every grouped range resolves", () => {
  it("every individual block resolves to exactly its own zone/charge", () => {
    let audited = 0;
    for (const area of ALL_AREAS) {
      const parsed = parseArea(area.area);
      if (parsed.blocks === ALL_BLOCKS || parsed.blocks.length === 0) continue;
      for (const block of parsed.blocks) {
        audited++;
        const q = queryForBlock(area.area, block);
        assert.ok(q, `could not build query for ${area.area}`);
        const matches = filterAreas(ALL_AREAS, q!);
        assert.equal(
          matches.length,
          1,
          `"${q}" must resolve to exactly one area (got ${matches.length})`,
        );
        assert.equal(matches[0].area, area.area, `"${q}" resolved to wrong area`);
        assert.equal(matches[0].zone, area.zone, `"${q}" resolved to wrong zone`);
        assert.equal(matches[0].charge, area.charge, `"${q}" resolved to wrong charge`);
        // Suggestion surface also reflects the block + zone + charge.
        const sug = suggestAreas(ALL_AREAS, q!);
        assert.equal(sug.length, 1);
        assert.equal(sug[0].zone, area.zone);
        assert.equal(sug[0].charge, area.charge);
        assert.ok(
          sug[0].label.toLowerCase().includes(String(block)),
          `"${q}" suggestion label "${sug[0].label}" should mention block ${block}`,
        );
      }
    }
    assert.ok(audited >= 90, `expected >= 90 audited blocks, got ${audited}`);
  });

  it("no individual block is covered by more than one zone (no ambiguity)", () => {
    const coveredBy: Record<string, Set<string>> = {};
    for (const area of ALL_AREAS) {
      const parsed = parseArea(area.area);
      if (parsed.blocks === ALL_BLOCKS) continue;
      for (const block of parsed.blocks) {
        const key = `${area.area.split(/\s+/)[0]} ${block}`;
        (coveredBy[key] ??= new Set()).add(`${area.zone}:${area.charge}`);
      }
    }
    for (const [block, zones] of Object.entries(coveredBy)) {
      assert.equal(zones.size, 1, `"${block}" is covered by multiple zones: ${[...zones]}`);
    }
  });
});

describe("seed-data parity — delivery-areas.ts matches prisma/seed-data.ts", () => {
  it("zone names, charges and areas are identical to the seed", () => {
    const seeded = seedData.zones.map((z) => ({
      name: z.name,
      charge: z.charge,
      areas: [...z.areas],
    }));
    const mirror = ZONES.map((z) => ({ name: z.name, charge: z.charge, areas: [...z.areas] }));
    assert.deepEqual(mirror, seeded);
  });

  it("flattened ALL_AREAS equals the seed's flattened zones", () => {
    const seeded = seedData.zones.flatMap((z) =>
      z.areas.map((a) => ({ area: a, zone: z.name, charge: z.charge })),
    );
    assert.deepEqual(ALL_AREAS, seeded);
  });
});

describe("resolveArea — exact block label, grouped range used only internally", () => {
  const expect = (
    query: string,
    expected: { area: string; zone: string; charge: number; label: string } | null,
  ) => {
    assert.deepEqual(resolveArea(ALL_AREAS, query), expected, `resolveArea("${query}")`);
  };

  it("returns the grouped area for zone/charge but the exact block as the label", () => {
    expect("Gulshan Block 15", {
      area: "Gulshan Block 14-17",
      zone: "Zone E",
      charge: 250,
      label: "Gulshan Block 15",
    });
    expect("Gulshan Block 4", {
      area: "Gulshan Block 4",
      zone: "Zone I",
      charge: 500,
      label: "Gulshan Block 4",
    });
    expect("Clifton Block 5", {
      area: "Clifton Block 1-6",
      zone: "Zone I",
      charge: 500,
      label: "Clifton Block 5",
    });
    expect("Clifton Block 7", {
      area: "Clifton Block 7,8,9",
      zone: "Zone H",
      charge: 450,
      label: "Clifton Block 7",
    });
    expect("Federal B Area Block 11", {
      area: "Federal B Area Block 11-22",
      zone: "Zone I",
      charge: 500,
      label: "Federal B Area Block 11",
    });
    expect("Federal B Area Block 10", {
      area: "Federal B Area Block 1-10",
      zone: "Zone H",
      charge: 450,
      label: "Federal B Area Block 10",
    });
    expect("Liaquatabad Block 10", {
      area: "Liaquatabad Block 1-4 & 10",
      zone: "Zone F",
      charge: 350,
      label: "Liaquatabad Block 10",
    });
    expect("Gulistan-e-Johar Block 13", {
      area: "Gulistan-e-Johar 1-13",
      zone: "Zone H",
      charge: 450,
      label: "Gulistan-e-Johar 13",
    });
    expect("Gulistan-e-Johar Block 15", {
      area: "Gulistan-e-Johar Block 14-20",
      zone: "Zone G",
      charge: 400,
      label: "Gulistan-e-Johar Block 15",
    });
  });

  it("non-block areas resolve to themselves", () => {
    expect("Bahadurabad", {
      area: "Bahadurabad",
      zone: "Zone A",
      charge: 140,
      label: "Bahadurabad",
    });
    expect("Shadman Town", {
      area: "Shadman Town",
      zone: "Zone I",
      charge: 500,
      label: "Shadman Town",
    });
    expect("P.E.C.H.S Block 2", {
      area: "P.E.C.H.S Block 2 & 3",
      zone: "Zone B",
      charge: 160,
      label: "P.E.C.H.S Block 2",
    });
  });

  it("All Blocks areas keep the grouped label", () => {
    expect("North Nazimabad Block 5", {
      area: "North Nazimabad All Blocks",
      zone: "Zone H",
      charge: 450,
      label: "North Nazimabad All Blocks",
    });
  });

  it("ambiguous or unmatched queries return null", () => {
    expect("Nazimabad Block 3", null);
    expect("Clifton Block 10", null);
    expect("Federal B Area Block 23", null);
    expect("Gulshan Block 21", null);
    expect("Emaar", null);
  });
});

describe("WhatsApp checkout payload — Area shows the exact customer block, never the zone", () => {
  const orderFor = (areaLabel: string, delivery: number) =>
    buildOrderMessage({
      customer: "Test Customer",
      phone: "0300-1234567",
      areaLabel,
      address: "House 5, Main Street",
      items: "• 2 × Large Chicken Special — Rs. 3,000",
      subtotal: 3000,
      delivery,
      grand: 3000 + delivery,
      paymentLabel: "Cash on Delivery",
    });

  const areaLine = (msg: string) => msg.split("\n").find((l) => l.startsWith("*Area:*"))!;

  it("Gulshan Block 15 shows the exact block, never the grouped range or zone", () => {
    const resolved = resolveArea(ALL_AREAS, "Gulshan Block 15");
    assert.ok(resolved, `"Gulshan Block 15" must resolve`);
    const msg = orderFor(resolved!.label, resolved!.charge);
    assert.equal(areaLine(msg), "*Area:* Gulshan Block 15");
    assert.ok(!msg.includes("14-17"), "grouped range must not leak into the message");
    assert.ok(!msg.includes("Zone"), "zone must never appear in the message");
  });

  it("builds the full message in the production format", () => {
    const msg = buildOrderMessage({
      customer: "Ali",
      phone: "0300-1234567",
      areaLabel: "Gulshan Block 15",
      address: "House 5",
      notes: "No onions",
      items: "• 1 × Chicken Shawarma — Rs. 450",
      subtotal: 450,
      delivery: 250,
      grand: 700,
      paymentLabel: "Cash on Delivery",
    });
    assert.equal(
      msg,
      [
        "*Al-Arab Shawarma — New Order*",
        "",
        "*Customer:* Ali",
        "*Phone:* 0300-1234567",
        "*Area:* Gulshan Block 15",
        "*Address:* House 5",
        "*Notes:* No onions",
        "*Items:*",
        "• 1 × Chicken Shawarma — Rs. 450",
        "",
        "*Subtotal:* Rs. 450",
        "*Delivery:* Rs. 250",
        "*Grand Total:* Rs. 700",
        "",
        "*Payment Method:* Cash on Delivery",
        "",
        "Thank you!",
      ].join("\n"),
    );
  });

  it("appends the payment screenshot note for advance payments", () => {
    const msg = buildOrderMessage({
      customer: "Ali",
      phone: "0300-1234567",
      areaLabel: "Clifton Block 5",
      address: "House 5",
      items: "• 1 × Chicken Shawarma — Rs. 450",
      subtotal: 450,
      delivery: 500,
      grand: 950,
      paymentLabel: "Easypaisa Transfer (0345-0000000 — Al-Arab Shawarma)",
      paymentNote: "\n_Please share the payment screenshot here on WhatsApp for verification._",
    });
    assert.ok(
      msg.includes(
        "*Payment Method:* Easypaisa Transfer (0345-0000000 — Al-Arab Shawarma)\n" +
          "_Please share the payment screenshot here on WhatsApp for verification._\n\n" +
          "Thank you!",
      ),
    );
    assert.ok(!msg.includes("Zone"), "zone must never appear in the message");
  });

  it("every resolved block appears exactly as entered in the Area line", () => {
    const cases: Array<[string, string]> = [
      ["Gulshan Block 15", "*Area:* Gulshan Block 15"],
      ["Gulshan Block 4", "*Area:* Gulshan Block 4"],
      ["Clifton Block 5", "*Area:* Clifton Block 5"],
      ["Clifton Block 7", "*Area:* Clifton Block 7"],
      ["Federal B Area Block 10", "*Area:* Federal B Area Block 10"],
      ["Federal B Area Block 11", "*Area:* Federal B Area Block 11"],
      ["Liaquatabad Block 10", "*Area:* Liaquatabad Block 10"],
      ["Gulistan-e-Johar Block 13", "*Area:* Gulistan-e-Johar 13"],
      ["North Nazimabad Block 5", "*Area:* North Nazimabad All Blocks"],
    ];
    for (const [query, wantLine] of cases) {
      const resolved = resolveArea(ALL_AREAS, query);
      assert.ok(resolved, `"${query}" must resolve`);
      const msg = orderFor(resolved!.label, resolved!.charge);
      assert.equal(areaLine(msg), wantLine, `area line for "${query}"`);
      assert.ok(!/(?:^|\W)Zone\s+\w/.test(msg), `"${query}" message must not mention any zone`);
    }
  });

  it("exhaustive: every block's WhatsApp message shows the exact block, never its range", () => {
    let audited = 0;
    for (const area of ALL_AREAS) {
      const parsed = parseArea(area.area);
      if (parsed.blocks === ALL_BLOCKS || parsed.blocks.length === 0) continue;
      for (const block of parsed.blocks) {
        audited++;
        const q = queryForBlock(area.area, block);
        assert.ok(q, `could not build query for ${area.area}`);
        const resolved = resolveArea(ALL_AREAS, q!);
        assert.ok(resolved, `"${q}" must resolve`);
        assert.equal(resolved!.zone, area.zone, `"${q}" resolved to wrong zone`);
        assert.equal(resolved!.charge, area.charge, `"${q}" resolved to wrong charge`);
        const msg = orderFor(resolved!.label, resolved!.charge);
        const line = areaLine(msg);
        assert.equal(line, `*Area:* ${resolved!.label}`, `area line for "${q}"`);
        const rangeSpec = area.area.match(/\d+(?:[-,&]\d+)*/)?.[0];
        if (rangeSpec && rangeSpec !== String(block)) {
          assert.ok(
            !line.includes(rangeSpec),
            `"${q}" line "${line}" must not include the grouped spec "${rangeSpec}"`,
          );
        }
      }
    }
    assert.ok(audited >= 90, `expected >= 90 audited blocks, got ${audited}`);
  });

  it("no zone name or code appears anywhere in any order message", () => {
    const zoneNames = ZONES.map((z) => z.name);
    for (const area of ALL_AREAS) {
      const msg = orderFor(area.area, area.charge);
      assert.ok(
        !/(?:^|\W)Zone\s+\w/.test(msg),
        `"${area.area}" message must not contain a zone code`,
      );
      for (const name of zoneNames) {
        assert.ok(!msg.includes(name), `"${area.area}" message must not contain "${name}"`);
      }
      assert.ok(!/\(Zone\b/.test(msg), `"${area.area}" message must not contain "(Zone ...)"`);
    }
  });
});
