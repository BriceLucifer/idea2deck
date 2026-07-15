import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { PDFDocument } from "pdf-lib";
import { buildDeck } from "../run.mjs";
import { sampleDeck } from "./fixtures.mjs";

test("builds matching PPTX and PDF deliverables", { timeout: 180_000 }, async () => {
  const workspace = await mkdtemp(join(tmpdir(), "idea-to-deck-pipeline-"));
  try {
    const specPath = join(workspace, "deck-spec.json");
    const outDir = join(workspace, "out");
    await mkdir(outDir);
    await writeFile(join(outDir, "existing-user-file.txt"), "preserve me");
    await writeFile(specPath, JSON.stringify(sampleDeck()));
    const result = await buildDeck({ specPath, outDir });
    assert.match(result.pptx, /sample-deck\.pptx$/);
    assert.match(result.pdf, /sample-deck\.pdf$/);
    assert.deepEqual((await readdir(outDir)).sort(), ["existing-user-file.txt", "sample-deck.pdf", "sample-deck.pptx"]);
    assert.deepEqual(result.warnings, []);
    assert.equal(result.pptxReport.nativeShapes, 1);
    assert.equal(result.pdfReport.mode, "raster-4k");
    const pdf = await PDFDocument.load(await readFile(result.pdf));
    assert.equal(pdf.getPageCount(), 1);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
