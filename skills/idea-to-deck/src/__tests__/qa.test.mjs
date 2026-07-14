import test from "node:test";
import assert from "node:assert/strict";
import { checkLayout } from "../qa/check-layout.mjs";
import { sampleDeck } from "./fixtures.mjs";

test("flags elements outside the logical canvas", () => {
  const deck = sampleDeck();
  deck.slides[0].elements[0].x = 1900;
  const result = checkLayout(deck);
  assert.equal(result.errors.length, 1);
});

test("warns about dense text", () => {
  const deck = sampleDeck();
  deck.slides[0].elements[0].w = 100;
  deck.slides[0].elements[0].h = 60;
  deck.slides[0].elements[0].text = "This text is intentionally too long for the assigned box.";
  const result = checkLayout(deck);
  assert.ok(result.warnings.some((warning) => warning.includes("overflow")));
});
