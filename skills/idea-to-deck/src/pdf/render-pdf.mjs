import { readFile, writeFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";

const PAGE_WIDTH = 960;
const PAGE_HEIGHT = 540;

export async function renderPdfFromPreviews(previewPaths, outputPath, metadata = {}) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(metadata.title ?? "Presentation");
  pdf.setSubject(metadata.subject ?? "");
  pdf.setAuthor(metadata.author ?? "idea-to-deck Codex skill");
  pdf.setCreator("idea-to-deck Codex skill");
  pdf.setProducer("pdf-lib");
  for (const previewPath of previewPaths) {
    const png = await pdf.embedPng(await readFile(previewPath));
    const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    page.drawImage(png, { x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT });
  }
  await writeFile(outputPath, await pdf.save({ useObjectStreams: true }));
  return outputPath;
}
