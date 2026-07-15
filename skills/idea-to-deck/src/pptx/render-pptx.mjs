import PptxGenJS from "pptxgenjs";
import { boxToPptx } from "../shared/layout.mjs";
import { pptxColor, resolveTheme } from "../shared/theme.mjs";

function imageSizing(element) {
  const box = boxToPptx(element);
  return element.fit === "contain"
    ? { path: element.path, ...box, sizing: "contain" }
    : { path: element.path, ...box, sizing: "cover" };
}

function chartType(pptx, type) {
  return {
    bar: pptx.ChartType.bar,
    column: pptx.ChartType.bar,
    line: pptx.ChartType.line,
    pie: pptx.ChartType.pie,
    doughnut: pptx.ChartType.doughnut,
  }[type];
}

function renderElement({ pptx, slide, element, theme }) {
  const box = boxToPptx(element);
  if (element.type === "text") {
    slide.addText(element.text, {
      ...box,
      fontFace: element.style.fontFace ?? theme.fontBody,
      fontSize: element.style.fontSize,
      color: pptxColor(element.style.color, theme.foreground),
      bold: element.style.bold,
      italic: element.style.italic,
      align: element.style.align,
      valign: element.style.valign,
      margin: element.style.margin / 72,
      breakLine: element.style.breakLine,
      fit: "shrink",
    });
    return;
  }
  if (element.type === "image") {
    slide.addImage(imageSizing(element));
    return;
  }
  if (element.type === "table") {
    slide.addTable(element.rows, {
      ...box,
      fontFace: theme.fontBody,
      fontSize: element.style.fontSize,
      color: pptxColor(element.style.color, theme.foreground),
      border: { color: pptxColor(element.style.borderColor, "D5D5D5"), pt: 1 },
      fill: pptxColor(theme.background),
      bold: false,
      autoFit: false,
      margin: 0.08,
      rowH: box.h / Math.max(1, element.rows.length),
    });
    return;
  }
  if (element.type === "chart") {
    const data = element.series.map((series) => ({
      name: series.name,
      labels: element.categories,
      values: series.values,
      color: series.color,
    }));
    slide.addChart(chartType(pptx, element.chartType), data, {
      ...box,
      showLegend: element.showLegend,
      showTitle: false,
      showValue: false,
      showCategoryName: false,
      catAxisLabelFontFace: theme.fontBody,
      valAxisLabelFontFace: theme.fontBody,
      chartColors: element.series.map((series, index) =>
        pptxColor(series.color, index === 0 ? theme.accent : theme.accent2)),
    });
    return;
  }
  if (element.type === "shape") {
    const shapeMap = {
      rect: pptx.ShapeType.rect,
      roundRect: pptx.ShapeType.roundRect,
      ellipse: pptx.ShapeType.ellipse,
      line: pptx.ShapeType.line,
    };
    slide.addShape(shapeMap[element.shape], {
      ...box,
      flipH: element.flipH,
      flipV: element.flipV,
      fill: element.fill ? { color: pptxColor(element.fill) } : { color: pptxColor(theme.background), transparency: 100 },
      line: { color: pptxColor(element.stroke, theme.foreground), pt: element.strokeWidth },
    });
    return;
  }
}

export async function renderPptx(deck, outputPath) {
  const pptx = new PptxGenJS();
  const theme = resolveTheme(deck.deck.theme);
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "idea-to-deck Codex skill";
  pptx.subject = deck.deck.objective;
  pptx.title = deck.deck.title;
  pptx.company = "OpenAI Codex";
  pptx.lang = deck.deck.language;
  pptx.theme = {
    headFontFace: theme.fontHeading,
    bodyFontFace: theme.fontBody,
    lang: deck.deck.language,
  };

  for (const slideSpec of deck.slides) {
    const slide = pptx.addSlide();
    slide.background = { color: pptxColor(slideSpec.background, theme.background) };
    for (const element of [...slideSpec.elements].sort((a, b) => a.zIndex - b.zIndex)) {
      renderElement({ pptx, slide, element, theme });
    }
    if (slideSpec.speakerNotes && typeof slide.addNotes === "function") {
      slide.addNotes(slideSpec.speakerNotes);
    }
  }

  await pptx.writeFile({ fileName: outputPath, compression: true });
  return outputPath;
}
