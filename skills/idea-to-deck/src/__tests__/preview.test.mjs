import test from "node:test";
import assert from "node:assert/strict";
import { parseDeckSpec } from "../schema/deck-spec.mjs";
import { renderSlideSvg } from "../preview/render-preview.mjs";
import { sampleDeck } from "./fixtures.mjs";

test("renders flipV lines from bottom-left to top-right", async () => {
  const input = sampleDeck();
  input.slides[0].elements = [{
    id: "up-line",
    type: "shape",
    shape: "line",
    x: 100,
    y: 200,
    w: 300,
    h: 150,
    zIndex: 1,
    allowOverlap: false,
    editable: true,
    stroke: "#00D4FF",
    strokeWidth: 4,
    flipV: true,
  }];
  const deck = parseDeckSpec(input);
  const svg = String(await renderSlideSvg(deck, deck.slides[0]));
  assert.match(svg, /x1="100" y1="350" x2="400" y2="200"/);
});
