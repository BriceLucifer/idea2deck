import { readFile, stat } from "node:fs/promises";
import JSZip from "jszip";

export async function inspectPptx(filePath, expectedSlideCount) {
  const info = await stat(filePath);
  if (info.size < 5_000) throw new Error("Generated PPTX is unexpectedly small.");

  const zip = await JSZip.loadAsync(await readFile(filePath));
  const required = ["[Content_Types].xml", "ppt/presentation.xml"];
  for (const entry of required) {
    if (!zip.file(entry)) throw new Error(`Generated PPTX is missing ${entry}.`);
  }

  const slideCount = Object.keys(zip.files).filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name)).length;
  if (slideCount !== expectedSlideCount) {
    throw new Error(`Generated PPTX has ${slideCount} slides; expected ${expectedSlideCount}.`);
  }
  return { size: info.size, slideCount };
}
