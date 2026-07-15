import test from "node:test";
import assert from "node:assert/strict";
import { fontPx, measureTextWidth, textInsets, wrapTextMeasured } from "../shared/text-metrics.mjs";

test("converts points to 144dpi logical pixels", () => {
  assert.equal(fontPx(36), 72);
  assert.deepEqual(textInsets({ margin: 6 }), { left: 12, right: 12, top: 12, bottom: 12 });
});

test("measures and wraps mixed CJK text", async () => {
  const style = { fontFace: "Arial", fontSize: 24, bold: false, italic: false };
  assert.ok(await measureTextWidth("神经网络 Neural", style) > 0);
  const lines = await wrapTextMeasured("神经网络帮助理解复杂模式", 180, style);
  assert.ok(lines.length > 1);
});
