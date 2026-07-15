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
    endArrowType: "triangle",
  }];
  const deck = parseDeckSpec(input);
  const svg = String(await renderSlideSvg(deck, deck.slides[0]));
  assert.match(svg, /x1="100" y1="350" x2="400" y2="200"/);
  assert.match(svg, /stroke-width="8"/);
  assert.match(svg, /marker-end=/);
});

test("uses 144dpi logical typography", async () => {
  const deck = parseDeckSpec(sampleDeck());
  const svg = String(await renderSlideSvg(deck, deck.slides[0]));
  assert.match(svg, /font-size="108"/);
});

test("renders every chart series and category in the preview", async () => {
  const input = sampleDeck();
  input.slides[0].elements = [{
    id: "chart", type: "chart", x: 100, y: 100, w: 1200, h: 700,
    zIndex: 1, allowOverlap: false, editable: true,
    chartType: "line", categories: ["First", "Second"],
    series: [
      { name: "Alpha", values: [1, 3], color: "#00AAFF" },
      { name: "Beta", values: [2, 4], color: "#AA44FF" },
    ],
    showLegend: true,
  }];
  const deck = parseDeckSpec(input);
  const svg = String(await renderSlideSvg(deck, deck.slides[0]));
  assert.match(svg, /#00AAFF/i);
  assert.match(svg, /#AA44FF/i);
  assert.match(svg, />Alpha</);
  assert.match(svg, />Beta</);
});
