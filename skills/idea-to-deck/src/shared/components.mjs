const DEFAULT_TEXT_STYLE = Object.freeze({
  fontSize: 28,
  color: "#F5F7FF",
  bold: false,
  italic: false,
  align: "left",
  valign: "top",
  margin: 0,
  lineHeight: 1.15,
  breakLine: false,
});

function common(id, box, { zIndex = 1, allowOverlap = false, editable = true } = {}) {
  return { id, x: box.x, y: box.y, w: box.w, h: box.h, zIndex, allowOverlap, editable };
}

function text(id, box, value, style = {}, options = {}) {
  return {
    type: "text",
    ...common(id, box, options),
    text: String(value),
    style: { ...DEFAULT_TEXT_STYLE, ...style },
  };
}

function center(box) {
  return { x: box.x + box.w / 2, y: box.y + box.h / 2 };
}

export function anchorPoint(box, anchor = "center", toward) {
  if (anchor === "auto") {
    if (!toward) throw new Error("auto anchor requires a target point");
    const origin = center(box);
    const dx = toward.x - origin.x;
    const dy = toward.y - origin.y;
    if (dx === 0 && dy === 0) throw new Error("cannot anchor between coincident centers");
    const rx = box.w / 2;
    const ry = box.h / 2;
    const scale = box.shape === "ellipse"
      ? 1 / Math.sqrt((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry))
      : 1 / Math.max(Math.abs(dx) / rx, Math.abs(dy) / ry);
    return { x: origin.x + dx * scale, y: origin.y + dy * scale };
  }
  const points = {
    top: { x: box.x + box.w / 2, y: box.y },
    right: { x: box.x + box.w, y: box.y + box.h / 2 },
    bottom: { x: box.x + box.w / 2, y: box.y + box.h },
    left: { x: box.x, y: box.y + box.h / 2 },
    center: { x: box.x + box.w / 2, y: box.y + box.h / 2 },
  };
  if (!points[anchor]) throw new Error(`Unknown anchor: ${anchor}`);
  return points[anchor];
}

export function connectorBetween({
  id,
  from,
  to,
  fromAnchor = "auto",
  toAnchor = "auto",
  stroke = "#7183A6",
  strokeWidth = 2,
  beginArrowType = "none",
  endArrowType = "none",
  zIndex = 1,
  allowOverlap = true,
}) {
  const fromCenter = center(from);
  const toCenter = center(to);
  const start = anchorPoint(from, fromAnchor, toCenter);
  const end = anchorPoint(to, toAnchor, fromCenter);
  return {
    id,
    type: "shape",
    shape: "line",
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    w: Math.abs(end.x - start.x),
    h: Math.abs(end.y - start.y),
    zIndex,
    allowOverlap,
    editable: true,
    stroke,
    strokeWidth,
    flipH: start.x > end.x,
    flipV: start.y > end.y,
    beginArrowType,
    endArrowType,
  };
}

export function titleBlock({
  id = "title",
  x = 120,
  y = 72,
  w = 1680,
  eyebrow,
  title,
  subtitle,
  titleSize = 54,
  accent = "#4CC9F0",
  foreground = "#F5F7FF",
  muted = "#9AA8C7",
  fontFace,
}) {
  const elements = [];
  let cursor = y;
  if (eyebrow) {
    elements.push(text(`${id}-eyebrow`, { x, y: cursor, w, h: 42 }, eyebrow, {
      fontFace, fontSize: 18, color: accent, bold: true,
    }));
    cursor += 62;
  }
  elements.push(text(`${id}-heading`, { x, y: cursor, w, h: titleSize * 2.2 }, title, {
    fontFace, fontSize: titleSize, color: foreground, bold: true,
  }));
  if (subtitle) {
    elements.push(text(`${id}-subtitle`, { x, y: cursor + titleSize * 2.2 + 18, w, h: 88 }, subtitle, {
      fontFace, fontSize: Math.max(20, titleSize * 0.45), color: muted,
    }));
  }
  return elements;
}

export function stepFlow({
  id = "flow",
  x,
  y,
  w,
  h,
  steps,
  gap = 48,
  fill = "#14354A",
  stroke = "#4CC9F0",
  alternateFill = "#30205B",
  alternateStroke = "#9B5DE5",
  connectorColor = "#52688F",
  fontFace,
  fontSize = 26,
}) {
  if (!Array.isArray(steps) || steps.length < 2) throw new Error("stepFlow requires at least two steps");
  const cardWidth = (w - gap * (steps.length - 1)) / steps.length;
  if (cardWidth <= 0) throw new Error("stepFlow width is too small for its steps and gap");
  const boxes = {};
  const cards = [];
  const connectors = [];
  steps.forEach((step, index) => {
    const stepId = typeof step === "string" ? String(index + 1) : String(step.id ?? index + 1);
    const label = typeof step === "string" ? step : step.label;
    const box = { x: x + index * (cardWidth + gap), y, w: cardWidth, h, shape: "roundRect" };
    boxes[stepId] = box;
    const useAlternate = index % 2 === 1;
    cards.push({
      id: `${id}-${stepId}-card`,
      type: "shape",
      shape: "roundRect",
      x: box.x,
      y: box.y,
      w: box.w,
      h: box.h,
      zIndex: 2,
      allowOverlap: false,
      editable: true,
      fill: useAlternate ? alternateFill : fill,
      stroke: useAlternate ? alternateStroke : stroke,
      strokeWidth: 3,
      radius: 24,
    });
    cards.push(text(`${id}-${stepId}-label`, box, label, {
      fontFace, fontSize, color: "#F5F7FF", bold: true, align: "center", valign: "mid",
    }, { zIndex: 3, allowOverlap: true }));
  });
  for (let index = 0; index < steps.length - 1; index += 1) {
    const leftId = typeof steps[index] === "string" ? String(index + 1) : String(steps[index].id ?? index + 1);
    const rightId = typeof steps[index + 1] === "string" ? String(index + 2) : String(steps[index + 1].id ?? index + 2);
    connectors.push(connectorBetween({
      id: `${id}-${leftId}-to-${rightId}`,
      from: boxes[leftId],
      to: boxes[rightId],
      stroke: connectorColor,
      strokeWidth: 3,
      endArrowType: "triangle",
      zIndex: 1,
    }));
  }
  return { elements: [...connectors, ...cards], boxes };
}

export function nodeGrid({
  id = "nodes",
  x,
  y,
  w,
  h,
  columns,
  nodeSize = 84,
  fill = "#183756",
  stroke = "#4CC9F0",
  alternateFill = "#30205B",
  alternateStroke = "#9B5DE5",
  fontFace,
  fontSize = 23,
}) {
  if (!Array.isArray(columns) || columns.length < 1) throw new Error("nodeGrid requires at least one column");
  if (w < nodeSize || h < nodeSize) throw new Error("nodeGrid bounds are smaller than nodeSize");
  const placements = {};
  const elements = [];
  const columnGap = columns.length === 1 ? 0 : (w - nodeSize) / (columns.length - 1);
  columns.forEach((column, columnIndex) => {
    const nodes = column.nodes ?? [];
    const columnId = String(column.id ?? columnIndex + 1);
    const nodeGap = nodes.length <= 1 ? 0 : (h - nodeSize) / (nodes.length - 1);
    nodes.forEach((node, nodeIndex) => {
      const nodeId = typeof node === "string" ? String(nodeIndex + 1) : String(node.id ?? nodeIndex + 1);
      const label = typeof node === "string" ? node : node.label;
      const box = { x: x + columnIndex * columnGap, y: y + nodeIndex * nodeGap, w: nodeSize, h: nodeSize, shape: "ellipse" };
      const key = `${columnId}.${nodeId}`;
      placements[key] = box;
      const alternate = columnIndex % 2 === 1;
      elements.push({
        id: `${id}-${columnId}-${nodeId}-shape`,
        type: "shape",
        shape: "ellipse",
        x: box.x,
        y: box.y,
        w: box.w,
        h: box.h,
        zIndex: 2,
        allowOverlap: false,
        editable: true,
        fill: alternate ? alternateFill : fill,
        stroke: alternate ? alternateStroke : stroke,
        strokeWidth: 3,
        radius: 0,
      });
      elements.push(text(`${id}-${columnId}-${nodeId}-label`, box, label, {
        fontFace, fontSize, color: "#F5F7FF", bold: true, align: "center", valign: "mid",
      }, { zIndex: 3, allowOverlap: true }));
    });
  });
  return { elements, nodes: placements };
}
