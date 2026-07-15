import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import sharp from "sharp";
import { checkImages } from "../qa/check-images.mjs";
import { sampleDeck } from "./fixtures.mjs";

function imageElement(path, fit) {
  return {
    id: `${fit}-image`, type: "image", x: 100, y: 100, w: 1000, h: 1000,
    zIndex: 1, allowOverlap: false, editable: false, path, alt: "test image",
    fit, allowUpscale: false,
  };
}

test("distinguishes contain and cover upscale requirements", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "idea-to-deck-image-"));
  try {
    const path = join(workspace, "wide.png");
    await sharp({ create: { width: 4000, height: 500, channels: 4, background: "#336699" } }).png().toFile(path);
    const containDeck = sampleDeck();
    containDeck.slides[0].elements = [imageElement(path, "contain")];
    assert.deepEqual((await checkImages(containDeck)).errors, []);
    const coverDeck = sampleDeck();
    coverDeck.slides[0].elements = [imageElement(path, "cover")];
    assert.equal((await checkImages(coverDeck)).errors.length, 1);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("reads data URI images", async () => {
  const png = await sharp({ create: { width: 40, height: 40, channels: 4, background: "#112233" } }).png().toBuffer();
  const deck = sampleDeck();
  deck.slides[0].elements = [{ ...imageElement(`data:image/png;base64,${png.toString("base64")}`, "contain"), allowUpscale: true }];
  assert.deepEqual((await checkImages(deck)).errors, []);
});
