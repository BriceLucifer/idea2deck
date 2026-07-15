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
