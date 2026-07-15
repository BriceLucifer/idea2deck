import { readFile, stat } from "node:fs/promises";
import JSZip from "jszip";

export async function inspectPptx(filePath, expectedSlideCount, deck) {
  const info = await stat(filePath);
  if (info.size < 5_000) throw new Error("Generated PPTX is unexpectedly small.");

  const zip = await JSZip.loadAsync(await readFile(filePath));
  const required = ["[Content_Types].xml", "ppt/presentation.xml"];
  for (const entry of required) {
    if (!zip.file(entry)) throw new Error(`Generated PPTX is missing ${entry}.`);
  }

  const slideNames = Object.keys(zip.files).filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name));
  const slideCount = slideNames.length;
  if (slideCount !== expectedSlideCount) {
    throw new Error(`Generated PPTX has ${slideCount} slides; expected ${expectedSlideCount}.`);
  }
  const slideXml = await Promise.all(slideNames.map((name) => zip.file(name).async("string")));
  const counts = {
    nativeShapes: slideXml.reduce((total, xml) => total + (xml.match(/<p:sp>/g) ?? []).length, 0),
    images: slideXml.reduce((total, xml) => total + (xml.match(/<p:pic>/g) ?? []).length, 0),
    tables: slideXml.reduce((total, xml) => total + (xml.match(/<a:tbl>/g) ?? []).length, 0),
    charts: Object.keys(zip.files).filter((name) => /^ppt\/charts\/chart\d+\.xml$/.test(name)).length,
  };
  if (deck) {
    const elements = deck.slides.flatMap((slide) => slide.elements);
    const expected = {
      nativeShapes: elements.filter((element) => ["text", "shape"].includes(element.type)).length,
      images: elements.filter((element) => element.type === "image").length,
      tables: elements.filter((element) => element.type === "table").length,
      charts: elements.filter((element) => element.type === "chart").length,
    };
    for (const [type, count] of Object.entries(expected)) {
      if (counts[type] !== count) throw new Error(`Generated PPTX has ${counts[type]} ${type}; expected ${count}.`);
    }
  }
  return { size: info.size, slideCount, ...counts };
}
