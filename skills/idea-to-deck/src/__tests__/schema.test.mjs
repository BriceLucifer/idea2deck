import test from "node:test";
import assert from "node:assert/strict";
import { assertBuildApproved, parseDeckSpec } from "../schema/deck-spec.mjs";
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
