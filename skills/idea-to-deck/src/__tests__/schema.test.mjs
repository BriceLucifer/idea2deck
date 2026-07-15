import test from "node:test";
import assert from "node:assert/strict";
import { assertBuildApproved, parseDeckSpec, validateDeckSpec } from "../schema/deck-spec.mjs";
import { sampleDeck } from "./fixtures.mjs";

test("accepts a confirmed 16:9 DeckSpec", () => {
  const deck = parseDeckSpec(sampleDeck());
  assert.equal(deck.deck.width, 1920);
});

test("rejects rendering before plan approval", () => {
  assert.throws(() => assertBuildApproved({ approval: { confirmed: false } }), /approval is required/i);
});

test("rejects invalid output slugs", () => {
  const input = sampleDeck();
  input.deck.slug = "Unsafe Name";
  assert.throws(() => parseDeckSpec(input));
});

test("returns structured validation errors without throwing", () => {
  const input = sampleDeck();
  input.deck.slug = "Unsafe Name";
  const result = validateDeckSpec(input);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /deck\.slug/);
});

test("supports upward-sloping editable line shapes", () => {
  const input = sampleDeck();
  input.slides[0].elements.push({
    id: "up-line",
    type: "shape",
    shape: "line",
    x: 120,
    y: 120,
    w: 320,
    h: 180,
    zIndex: 2,
    allowOverlap: true,
    editable: true,
    stroke: "#00D4FF",
    strokeWidth: 3,
    flipV: true,
  });
  const deck = parseDeckSpec(input);
  assert.equal(deck.slides[0].elements.at(-1).flipV, true);
});

test("supports exact horizontal and vertical lines", () => {
  const input = sampleDeck();
  input.slides[0].elements = [{
    id: "horizontal",
    type: "shape",
    shape: "line",
    x: 120,
    y: 320,
    w: 400,
    h: 0,
    zIndex: 1,
    allowOverlap: true,
    editable: true,
    strokeWidth: 2,
    endArrowType: "triangle",
  }];
  const deck = parseDeckSpec(input);
  assert.equal(deck.slides[0].elements[0].h, 0);
  input.slides[0].elements[0].w = 0;
  input.slides[0].elements[0].h = 400;
  assert.equal(parseDeckSpec(input).slides[0].elements[0].w, 0);
});

test("rejects a zero-length line", () => {
  const input = sampleDeck();
  input.slides[0].elements = [{
    id: "point",
    type: "shape",
    shape: "line",
    x: 120,
    y: 320,
    w: 0,
    h: 0,
    zIndex: 1,
    allowOverlap: true,
    editable: true,
  }];
  assert.throws(() => parseDeckSpec(input), /non-zero width or height/i);
});

test("rejects duplicate element ids and dangling source references", () => {
  const input = sampleDeck();
  input.slides[0].elements.push({ ...input.slides[0].elements[0], sourceId: "missing" });
  const result = validateDeckSpec(input);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /duplicate element id/);
  assert.match(result.errors.join("\n"), /sourceId does not reference/);
});

test("rejects malformed table and chart data", () => {
  const input = sampleDeck();
  input.slides[0].elements = [{
    id: "bad-table", type: "table", x: 10, y: 10, w: 600, h: 300,
    zIndex: 1, allowOverlap: false, editable: true,
    rows: [["A", "B"], ["only one"]], headerRows: 3, style: {},
  }, {
    id: "bad-chart", type: "chart", x: 650, y: 10, w: 600, h: 300,
    zIndex: 1, allowOverlap: false, editable: true,
    chartType: "line", categories: ["A", "B"],
    series: [{ name: "S", values: [1] }], showLegend: false,
  }];
  const result = validateDeckSpec(input);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /rectangle/);
  assert.match(result.errors.join("\n"), /category count/);
});
