import { intersectionArea, isInsideCanvas } from "../shared/layout.mjs";

function approximateTextCapacity(element) {
  if (element.type !== "text") return null;
  const fontSize = element.style?.fontSize ?? 28;
  const margin = (element.style?.margin ?? 0) * 2;
  const width = Math.max(1, element.w - margin * 2);
  const height = Math.max(1, element.h - margin * 2);
  const charsPerLine = Math.max(1, Math.floor(width / (fontSize * 2 * 0.55)));
  const lines = Math.max(1, Math.floor(height / (fontSize * 2 * 1.15)));
  return charsPerLine * lines;
}

export function checkLayout(deck) {
  const errors = [];
  const warnings = [];

  for (const [slideIndex, slide] of deck.slides.entries()) {
    const ids = new Set();
    for (const element of slide.elements) {
      const label = `slide ${slideIndex + 1} element ${element.id}`;
      if (ids.has(element.id)) errors.push(`${label}: duplicate element id`);
      ids.add(element.id);
      if (!isInsideCanvas(element)) errors.push(`${label}: outside the 1920x1080 canvas`);

      const capacity = approximateTextCapacity(element);
      if (capacity !== null && element.text.length > capacity * 1.15) {
        warnings.push(`${label}: text may overflow its box`);
      }
      if (element.type === "text" && (element.style?.fontSize ?? 28) < 16) {
        warnings.push(`${label}: font size is below 16pt`);
      }
    }

    const ordered = [...slide.elements].sort((a, b) => a.zIndex - b.zIndex);
    for (let i = 0; i < ordered.length; i += 1) {
      for (let j = i + 1; j < ordered.length; j += 1) {
        const a = ordered[i];
        const b = ordered[j];
        if (a.allowOverlap || b.allowOverlap) continue;
        const overlap = intersectionArea(a, b);
        const smaller = Math.min(a.w * a.h, b.w * b.h);
        if (overlap > smaller * 0.15) {
          warnings.push(`slide ${slideIndex + 1}: ${a.id} and ${b.id} overlap on the same layer`);
        }
      }
    }
  }

  return { errors, warnings };
}

export function assertLayout(deck) {
  const result = checkLayout(deck);
  if (result.errors.length > 0) {
    throw new Error(`Layout validation failed:\n${result.errors.join("\n")}`);
  }
  return result;
}
