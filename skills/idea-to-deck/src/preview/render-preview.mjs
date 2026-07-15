import { mkdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { cssColor, resolveTheme } from "../shared/theme.mjs";
import { fontPx, measureTextBlock, textInsets } from "../shared/text-metrics.mjs";
import { ptToLogicalPx } from "../shared/layout.mjs";

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
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
  const strokeWidth = ptToLogicalPx(element.strokeWidth);
  if (element.shape === "line") {
    const x1 = element.flipH ? element.x + element.w : element.x;
    const x2 = element.flipH ? element.x : element.x + element.w;
    const y1 = element.flipV ? element.y + element.h : element.y;
    const y2 = element.flipV ? element.y : element.y + element.h;
    const marker = (type, suffix) => {
      if (!type || type === "none") return { definition: "", attribute: "" };
      const markerId = `${element.id.replace(/[^a-zA-Z0-9_-]/g, "-")}-${suffix}`;
      const body = type === "diamond"
        ? `<path d="M 1 5 L 5 1 L 9 5 L 5 9 Z" fill="${stroke}"/>`
        : type === "oval"
          ? `<circle cx="5" cy="5" r="4" fill="${stroke}"/>`
          : `<path d="M 1 1 L 9 5 L 1 9 Z" fill="${stroke}"/>`;
      return {
        definition: `<marker id="${markerId}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">${body}</marker>`,
        attribute: ` marker-${suffix}="url(#${markerId})"`,
      };
    };
    const startMarker = marker(element.beginArrowType, "start");
    const endMarker = marker(element.endArrowType, "end");
    return `<defs>${startMarker.definition}${endMarker.definition}</defs><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${strokeWidth}"${startMarker.attribute}${endMarker.attribute}/>`;
  }
  if (element.shape === "ellipse") {
    return `<ellipse cx="${element.x + element.w / 2}" cy="${element.y + element.h / 2}" rx="${element.w / 2}" ry="${element.h / 2}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
  }
  const radius = element.shape === "roundRect" ? Math.max(16, element.radius || 24) : 0;
  return `<rect x="${element.x}" y="${element.y}" width="${element.w}" height="${element.h}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
}

async function textSvg(element, theme) {
  const style = { ...element.style, fontFace: element.style.fontFace ?? theme.fontBody };
  const size = fontPx(style.fontSize);
  const insets = textInsets(style);
  const innerWidth = Math.max(1, element.w - insets.left - insets.right);
  const innerHeight = Math.max(1, element.h - insets.top - insets.bottom);
  const measurement = await measureTextBlock(element.text, innerWidth, style);
  const { lines, lineHeight, totalHeight } = measurement;
  const startY = style.valign === "mid"
    ? element.y + insets.top + (innerHeight - totalHeight) / 2 + size
    : style.valign === "bottom"
      ? element.y + element.h - insets.bottom - totalHeight + size
      : element.y + insets.top + size;
  const anchor = { left: "start", center: "middle", right: "end" }[style.align];
  const x = style.align === "center"
    ? element.x + insets.left + innerWidth / 2
    : style.align === "right"
      ? element.x + element.w - insets.right
      : element.x + insets.left;
  const tspans = lines.map((line, index) =>
    `<tspan x="${x}" y="${startY + index * lineHeight}">${escapeXml(line)}</tspan>`).join("");
  return `<text font-family="${escapeXml(style.fontFace ?? theme.fontBody)}" font-size="${size}" font-weight="${style.bold ? 700 : 400}" font-style="${style.italic ? "italic" : "normal"}" fill="${cssColor(style.color, cssColor(theme.foreground))}" text-anchor="${anchor}">${tspans}</text>`;
}

async function tableSvg(element, theme) {
  const rowHeight = element.h / element.rows.length;
  const columns = Math.max(...element.rows.map((row) => row.length));
  const columnWidth = element.w / columns;
  const parts = [];
  const padding = ptToLogicalPx(element.style.margin);
  for (const [rowIndex, row] of element.rows.entries()) {
    for (let columnIndex = 0; columnIndex < columns; columnIndex += 1) {
      const x = element.x + columnIndex * columnWidth;
      const y = element.y + rowIndex * rowHeight;
      const header = rowIndex < element.headerRows;
      const fill = header
        ? cssColor(element.style.headerFill, cssColor(theme.accent))
        : cssColor(element.style.rowFill, cssColor(theme.background));
      const color = header
        ? cssColor(element.style.headerColor, "#FFFFFF")
        : cssColor(element.style.color, cssColor(theme.foreground));
      const cellStyle = { fontFace: theme.fontBody, fontSize: element.style.fontSize, bold: header };
      const innerWidth = Math.max(1, columnWidth - padding * 2);
      const innerHeight = Math.max(1, rowHeight - padding * 2);
      const measurement = await measureTextBlock(row[columnIndex] ?? "", innerWidth, cellStyle);
      const startY = y + padding + Math.max(0, (innerHeight - measurement.totalHeight) / 2) + fontPx(element.style.fontSize);
      const clipId = `${element.id.replace(/[^a-zA-Z0-9_-]/g, "-")}-${rowIndex}-${columnIndex}`;
      const tspans = measurement.lines.map((line, lineIndex) =>
        `<tspan x="${x + padding}" y="${startY + lineIndex * measurement.lineHeight}">${escapeXml(line)}</tspan>`).join("");
      parts.push(`<rect x="${x}" y="${y}" width="${columnWidth}" height="${rowHeight}" fill="${fill}" stroke="${cssColor(element.style.borderColor, "#D5D5D5")}" stroke-width="${ptToLogicalPx(1)}"/>`);
      parts.push(`<defs><clipPath id="${clipId}"><rect x="${x + padding}" y="${y + padding}" width="${innerWidth}" height="${innerHeight}"/></clipPath></defs><text clip-path="url(#${clipId})" font-family="${escapeXml(theme.fontBody)}" font-size="${fontPx(element.style.fontSize)}" font-weight="${header ? 700 : 400}" fill="${color}">${tspans}</text>`);
    }
  }
  return parts.join("");
}

function polarPoint(cx, cy, radius, angle) {
  return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
}

function donutSlicePath(cx, cy, outerRadius, innerRadius, startAngle, endAngle) {
  const outerStart = polarPoint(cx, cy, outerRadius, startAngle);
  const outerEnd = polarPoint(cx, cy, outerRadius, endAngle);
  const innerEnd = polarPoint(cx, cy, innerRadius, endAngle);
  const innerStart = polarPoint(cx, cy, innerRadius, startAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  if (innerRadius <= 0) {
    return `M ${cx} ${cy} L ${outerStart.x} ${outerStart.y} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y} Z`;
  }
  return `M ${outerStart.x} ${outerStart.y} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y} L ${innerEnd.x} ${innerEnd.y} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y} Z`;
}

function chartSvg(element, theme) {
  const colors = element.series.map((series, index) =>
    cssColor(series.color, cssColor(index === 0 ? theme.accent : theme.accent2)));
  const allValues = element.series.flatMap((series) => series.values);
  const min = Math.min(0, ...allValues);
  const max = Math.max(1, ...allValues);
  const range = Math.max(1, max - min);
  const left = element.x + 54;
  const top = element.y + 34;
  const width = Math.max(1, element.w - 84);
  const height = Math.max(1, element.h - 76);
  const parts = [];
  const labelSize = fontPx(11);

  if (["pie", "doughnut"].includes(element.chartType)) {
    const values = element.series[0].values.map((value) => Math.max(0, value));
    const total = values.reduce((sum, value) => sum + value, 0) || 1;
    const cx = element.x + element.w / 2;
    const cy = element.y + element.h / 2;
    const outer = Math.max(10, Math.min(element.w, element.h) * 0.36);
    const inner = element.chartType === "doughnut" ? outer * 0.55 : 0;
    let angle = -Math.PI / 2;
    values.forEach((value, index) => {
      const next = angle + (value / total) * Math.PI * 2;
      const palette = [theme.accent, theme.accent2, "#2DD4BF", "#F59E0B", "#F43F5E"];
      parts.push(`<path d="${donutSlicePath(cx, cy, outer, inner, angle, next)}" fill="${cssColor(palette[index % palette.length])}"/>`);
      angle = next;
    });
    return parts.join("");
  }

  if (element.chartType === "line") {
    element.series.forEach((series, seriesIndex) => {
      const points = series.values.map((value, index) => {
        const x = left + (series.values.length === 1 ? width / 2 : (index / (series.values.length - 1)) * width);
        const y = top + height - ((value - min) / range) * height;
        return `${x},${y}`;
      }).join(" ");
      parts.push(`<polyline points="${points}" fill="none" stroke="${colors[seriesIndex]}" stroke-width="${ptToLogicalPx(2.5)}"/>`);
    });
  } else if (element.chartType === "bar") {
    const groupHeight = height / element.categories.length;
    const barHeight = Math.max(2, groupHeight * 0.68 / element.series.length);
    element.categories.forEach((category, categoryIndex) => {
      element.series.forEach((series, seriesIndex) => {
        const valueWidth = ((series.values[categoryIndex] - min) / range) * width;
        const y = top + categoryIndex * groupHeight + groupHeight * 0.16 + seriesIndex * barHeight;
        parts.push(`<rect x="${left}" y="${y}" width="${Math.max(1, valueWidth)}" height="${barHeight}" rx="3" fill="${colors[seriesIndex]}"/>`);
      });
      parts.push(`<text x="${left - 8}" y="${top + (categoryIndex + 0.58) * groupHeight}" text-anchor="end" font-family="${escapeXml(theme.fontBody)}" font-size="${labelSize}" fill="${cssColor(theme.muted)}">${escapeXml(category)}</text>`);
    });
  } else {
    const groupWidth = width / element.categories.length;
    const barWidth = Math.max(2, groupWidth * 0.68 / element.series.length);
    element.categories.forEach((category, categoryIndex) => {
      element.series.forEach((series, seriesIndex) => {
        const barHeight = ((series.values[categoryIndex] - min) / range) * height;
        const x = left + categoryIndex * groupWidth + groupWidth * 0.16 + seriesIndex * barWidth;
        parts.push(`<rect x="${x}" y="${top + height - barHeight}" width="${barWidth}" height="${Math.max(1, barHeight)}" rx="3" fill="${colors[seriesIndex]}"/>`);
      });
      parts.push(`<text x="${left + (categoryIndex + 0.5) * groupWidth}" y="${top + height + labelSize + 8}" text-anchor="middle" font-family="${escapeXml(theme.fontBody)}" font-size="${labelSize}" fill="${cssColor(theme.muted)}">${escapeXml(category)}</text>`);
    });
  }

  if (element.showLegend && element.series.length > 1) {
    element.series.forEach((series, index) => {
      const legendX = element.x + element.w - 170;
      const legendY = element.y + 14 + index * 28;
      parts.push(`<rect x="${legendX}" y="${legendY}" width="18" height="18" rx="3" fill="${colors[index]}"/><text x="${legendX + 26}" y="${legendY + 17}" font-family="${escapeXml(theme.fontBody)}" font-size="${labelSize}" fill="${cssColor(theme.muted)}">${escapeXml(series.name)}</text>`);
    });
  }
  return parts.join("");
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
  await rm(previewDir, { recursive: true, force: true });
  await mkdir(previewDir, { recursive: true });
  const previews = [];
  for (const [index, slide] of deck.slides.entries()) {
    const output = join(previewDir, `slide-${String(index + 1).padStart(2, "0")}.png`);
    await sharp(await renderSlideSvg(deck, slide)).resize(3840, 2160).png().toFile(output);
    previews.push(output);
  }
  return previews;
}
