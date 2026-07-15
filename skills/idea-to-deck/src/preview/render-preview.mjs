import { mkdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import sharp from "sharp";
import { cssColor, resolveTheme } from "../shared/theme.mjs";

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function fontPx(points) {
  return points * (4 / 3);
}

function wrapText(text, width, fontSize) {
  const maxChars = Math.max(1, Math.floor(width / (fontPx(fontSize) * 0.55)));
  const paragraphs = String(text).split("\n");
  const lines = [];
  for (const paragraph of paragraphs) {
    if (!paragraph) {
      lines.push("");
      continue;
    }
    const tokens = paragraph.includes(" ") ? paragraph.split(/(\s+)/).filter(Boolean) : Array.from(paragraph);
    let current = "";
    for (const token of tokens) {
      if ((current + token).length > maxChars && current.trim()) {
        lines.push(current.trimEnd());
        current = token.trimStart();
      } else {
        current += token;
      }
    }
    if (current) lines.push(current.trimEnd());
  }
  return lines;
}

async function imageDataUri(path) {
  if (/^data:/i.test(path)) return path;
  if (/^https?:\/\//i.test(path)) throw new Error(`Remote image must be downloaded before rendering: ${path}`);
  const png = await sharp(await readFile(path)).png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

function shapeSvg(element, theme) {
  const fill = element.fill ? cssColor(element.fill) : "none";
  const stroke = cssColor(element.stroke, cssColor(theme.foreground));
  if (element.shape === "line") {
    const x1 = element.flipH ? element.x + element.w : element.x;
    const x2 = element.flipH ? element.x : element.x + element.w;
    const y1 = element.flipV ? element.y + element.h : element.y;
    const y2 = element.flipV ? element.y : element.y + element.h;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${element.strokeWidth}"/>`;
  }
  if (element.shape === "ellipse") {
    return `<ellipse cx="${element.x + element.w / 2}" cy="${element.y + element.h / 2}" rx="${element.w / 2}" ry="${element.h / 2}" fill="${fill}" stroke="${stroke}" stroke-width="${element.strokeWidth}"/>`;
  }
  const radius = element.shape === "roundRect" ? Math.max(16, element.radius || 24) : 0;
  return `<rect x="${element.x}" y="${element.y}" width="${element.w}" height="${element.h}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${element.strokeWidth}"/>`;
}

function textSvg(element, theme) {
  const style = element.style;
  const size = fontPx(style.fontSize);
  const lineHeight = size * 1.15;
  const lines = wrapText(element.text, element.w, style.fontSize);
  const totalHeight = lines.length * lineHeight;
  const startY = style.valign === "mid"
    ? element.y + (element.h - totalHeight) / 2 + size
    : style.valign === "bottom"
      ? element.y + element.h - totalHeight + size
      : element.y + size;
  const anchor = { left: "start", center: "middle", right: "end" }[style.align];
  const x = style.align === "center" ? element.x + element.w / 2 : style.align === "right" ? element.x + element.w : element.x;
  const tspans = lines.map((line, index) =>
    `<tspan x="${x}" y="${startY + index * lineHeight}">${escapeXml(line)}</tspan>`).join("");
  return `<text font-family="${escapeXml(style.fontFace ?? theme.fontBody)}" font-size="${size}" font-weight="${style.bold ? 700 : 400}" font-style="${style.italic ? "italic" : "normal"}" fill="${cssColor(style.color, cssColor(theme.foreground))}" text-anchor="${anchor}">${tspans}</text>`;
}

function tableSvg(element, theme) {
  const rowHeight = element.h / element.rows.length;
  const columns = Math.max(...element.rows.map((row) => row.length));
  const columnWidth = element.w / columns;
  const parts = [];
  for (const [rowIndex, row] of element.rows.entries()) {
    for (let columnIndex = 0; columnIndex < columns; columnIndex += 1) {
      const x = element.x + columnIndex * columnWidth;
      const y = element.y + rowIndex * rowHeight;
      const header = rowIndex < element.headerRows;
      parts.push(`<rect x="${x}" y="${y}" width="${columnWidth}" height="${rowHeight}" fill="${header ? cssColor(element.style.headerFill, cssColor(theme.accent)) : cssColor(theme.background)}" stroke="${cssColor(element.style.borderColor, "#D5D5D5")}"/>`);
      parts.push(`<text x="${x + 12}" y="${y + rowHeight / 2 + fontPx(element.style.fontSize) / 3}" font-family="${escapeXml(theme.fontBody)}" font-size="${fontPx(element.style.fontSize)}" font-weight="${header ? 700 : 400}" fill="${header ? "#FFFFFF" : cssColor(element.style.color, cssColor(theme.foreground))}">${escapeXml(row[columnIndex] ?? "")}</text>`);
    }
  }
  return parts.join("");
}

function chartSvg(element, theme) {
  const values = element.series[0]?.values ?? [];
  const max = Math.max(1, ...element.series.flatMap((series) => series.values));
  const color = cssColor(element.series[0]?.color, cssColor(theme.accent));
  if (element.chartType === "line") {
    const points = values.map((value, index) => {
      const x = element.x + (values.length === 1 ? element.w / 2 : (index / (values.length - 1)) * element.w);
      const y = element.y + element.h - (value / max) * (element.h * 0.85) - element.h * 0.05;
      return `${x},${y}`;
    }).join(" ");
    return `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="8"/>`;
  }
  const gap = 16;
  const barWidth = Math.max(8, (element.w - gap * (values.length + 1)) / Math.max(1, values.length));
  return values.map((value, index) => {
    const height = Math.max(2, (value / max) * (element.h * 0.9));
    const x = element.x + gap + index * (barWidth + gap);
    const y = element.y + element.h - height;
    return `<rect x="${x}" y="${y}" width="${barWidth}" height="${height}" rx="8" fill="${color}"/>`;
  }).join("");
}

async function elementSvg(element, theme) {
  if (element.type === "text") return textSvg(element, theme);
  if (element.type === "shape") return shapeSvg(element, theme);
  if (element.type === "table") return tableSvg(element, theme);
  if (element.type === "chart") return chartSvg(element, theme);
  if (element.type === "image") {
    const href = await imageDataUri(element.path);
    const aspect = element.fit === "contain" ? "xMidYMid meet" : "xMidYMid slice";
    return `<image x="${element.x}" y="${element.y}" width="${element.w}" height="${element.h}" href="${href}" preserveAspectRatio="${aspect}"/>`;
  }
  return "";
}

export async function renderSlideSvg(deck, slide) {
  const theme = resolveTheme(deck.deck.theme);
  const parts = [];
  for (const element of [...slide.elements].sort((a, b) => a.zIndex - b.zIndex)) {
    parts.push(await elementSvg(element, theme));
  }
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080"><rect width="1920" height="1080" fill="${cssColor(slide.background, cssColor(theme.background))}"/>${parts.join("")}</svg>`);
}

export async function renderDeckPreviews(deck, workspace) {
  const previewDir = join(workspace, "previews");
  await mkdir(previewDir, { recursive: true });
  const previews = [];
  for (const [index, slide] of deck.slides.entries()) {
    const output = join(previewDir, `slide-${String(index + 1).padStart(2, "0")}.png`);
    await sharp(await renderSlideSvg(deck, slide)).resize(3840, 2160).png().toFile(output);
    previews.push(output);
  }
  return previews;
}
