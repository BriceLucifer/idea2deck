import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import JSZip from "jszip";
import { renderPptx } from "../pptx/render-pptx.mjs";
import { inspectPptx } from "../qa/inspect-pptx.mjs";
import { sampleDeck } from "./fixtures.mjs";

test("PptxGenJS creates a structurally valid editable deck", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "idea-to-deck-test-"));
  try {
    const output = join(workspace, "sample.pptx");
    await renderPptx(sampleDeck(), output);
    const report = await inspectPptx(output, 1);
    assert.equal(report.slideCount, 1);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("PPTX preserves connector width and arrow semantics", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "idea-to-deck-line-"));
  try {
    const deck = sampleDeck();
    deck.slides[0].elements = [{
      id: "connector",
      type: "shape",
      shape: "line",
      x: 120,
      y: 320,
      w: 600,
      h: 0,
      zIndex: 1,
      allowOverlap: true,
      editable: true,
      stroke: "#00D4FF",
      strokeWidth: 3,
      endArrowType: "triangle",
    }];
    const output = join(workspace, "line.pptx");
    await renderPptx(deck, output);
    const zip = await JSZip.loadAsync(await readFile(output));
    const xml = await zip.file("ppt/slides/slide1.xml").async("string");
    assert.match(xml, /<a:ln w="38100">/);
    assert.match(xml, /<a:tailEnd type="triangle"/);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("PPTX preserves table headers and bar directions", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "idea-to-deck-data-"));
  try {
    const deck = sampleDeck();
    deck.slides[0].elements = [{
      id: "table", type: "table", x: 80, y: 80, w: 700, h: 360,
      zIndex: 1, allowOverlap: false, editable: true,
      rows: [["Header", "Value"], ["A", 10]], headerRows: 1,
      style: { fontSize: 18, headerFill: "#123456", headerColor: "#FFFFFF", rowFill: "#0B1220", borderColor: "#D5D5D5", margin: 6 },
    }, {
      id: "bar", type: "chart", x: 820, y: 80, w: 500, h: 360,
      zIndex: 1, allowOverlap: false, editable: true,
      chartType: "bar", categories: ["A", "B"], series: [{ name: "S", values: [1, 2] }], showLegend: false,
    }, {
      id: "column", type: "chart", x: 1320, y: 80, w: 500, h: 360,
      zIndex: 1, allowOverlap: false, editable: true,
      chartType: "column", categories: ["A", "B"], series: [{ name: "S", values: [1, 2] }], showLegend: false,
    }];
    const output = join(workspace, "data.pptx");
    await renderPptx(deck, output);
    const report = await inspectPptx(output, 1, deck);
    assert.equal(report.tables, 1);
    assert.equal(report.charts, 2);
    const zip = await JSZip.loadAsync(await readFile(output));
    const slideXml = await zip.file("ppt/slides/slide1.xml").async("string");
    assert.match(slideXml, /123456/);
    const charts = await Promise.all(["ppt/charts/chart1.xml", "ppt/charts/chart2.xml"].map((name) => zip.file(name).async("string")));
    assert.ok(charts.some((xml) => /<c:barDir val="bar"\/>/.test(xml)));
    assert.ok(charts.some((xml) => /<c:barDir val="col"\/>/.test(xml)));
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
