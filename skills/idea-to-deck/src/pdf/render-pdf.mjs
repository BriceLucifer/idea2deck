import { readFile, writeFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";

const PAGE_WIDTH = 960;
const PAGE_HEIGHT = 540;

export async function renderPdfFromPreviews(previewPaths, outputPath) {
  const pdf = await PDFDocument.create();
  for (const previewPath of previewPaths) {
    const png = await pdf.embedPng(await readFile(previewPath));
    const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    page.drawImage(png, { x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT });
  }
  await writeFile(outputPath, await pdf.save({ useObjectStreams: true }));
  return outputPath;
}
