import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
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
