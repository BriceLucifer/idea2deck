import test from "node:test";
import assert from "node:assert/strict";
import { connectorBetween, nodeGrid, stepFlow, titleBlock } from "../shared/components.mjs";
import { parseDeckSpec } from "../schema/deck-spec.mjs";
import { sampleDeck } from "./fixtures.mjs";

test("anchors a horizontal connector exactly on card edges", () => {
  const connector = connectorBetween({
    id: "a-to-b",
    from: { x: 100, y: 200, w: 200, h: 100, shape: "rect" },
    to: { x: 500, y: 200, w: 200, h: 100, shape: "rect" },
    endArrowType: "triangle",
  });
  assert.deepEqual({ x: connector.x, y: connector.y, w: connector.w, h: connector.h }, { x: 300, y: 250, w: 200, h: 0 });
  const input = sampleDeck();
  input.slides[0].elements = [connector];
  assert.equal(parseDeckSpec(input).slides[0].elements[0].endArrowType, "triangle");
});

test("builds deterministic native step and node layouts", () => {
  const flow = stepFlow({ x: 100, y: 300, w: 1200, h: 180, steps: ["Predict", "Loss", "Update"] });
  assert.equal(flow.elements.length, 8);
  assert.equal(flow.elements.filter((element) => element.shape === "line").length, 2);
  const grid = nodeGrid({
    x: 100, y: 100, w: 900, h: 600,
    columns: [{ id: "in", nodes: [{ id: "x1", label: "x₁" }, { id: "x2", label: "x₂" }] }, { id: "out", nodes: [{ id: "y", label: "ŷ" }] }],
  });
  assert.ok(grid.nodes["in.x1"]);
  assert.equal(grid.elements.length, 6);
});

test("creates a concise title block", () => {
  const elements = titleBlock({ eyebrow: "SECTION", title: "A clear headline", subtitle: "One supporting sentence" });
  assert.deepEqual(elements.map((element) => element.id), ["title-eyebrow", "title-heading", "title-subtitle"]);
});
