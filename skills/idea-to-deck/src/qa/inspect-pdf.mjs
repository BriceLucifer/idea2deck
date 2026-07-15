import { readFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";

const PAGE_WIDTH = 960;
const PAGE_HEIGHT = 540;

export async function inspectPdf(filePath, expectedPageCount) {
  const pdf = await PDFDocument.load(await readFile(filePath));
  const pages = pdf.getPages();
  if (pages.length !== expectedPageCount) {
    throw new Error(`Expected ${expectedPageCount} PDF pages, found ${pages.length}.`);
  }
  pages.forEach((page, index) => {
    const width = page.getWidth();
    const height = page.getHeight();
    if (Math.abs(width - PAGE_WIDTH) > 0.01 || Math.abs(height - PAGE_HEIGHT) > 0.01) {
      throw new Error(`PDF page ${index + 1} is ${width}x${height}; expected ${PAGE_WIDTH}x${PAGE_HEIGHT}.`);
    }
  });
  return { pageCount: pages.length, width: PAGE_WIDTH, height: PAGE_HEIGHT, mode: "raster-4k" };
}
