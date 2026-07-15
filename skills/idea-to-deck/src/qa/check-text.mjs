import { measureTextBlock, textInsets } from "../shared/text-metrics.mjs";
import { resolveTheme } from "../shared/theme.mjs";

export async function checkTextFit(deck) {
  const errors = [];
  const warnings = [];
  const theme = resolveTheme(deck.deck.theme);
  for (const [slideIndex, slide] of deck.slides.entries()) {
    for (const element of slide.elements) {
      if (element.type !== "text") continue;
      const style = { ...element.style, fontFace: element.style.fontFace ?? theme.fontBody };
      const insets = textInsets(style);
      const innerWidth = Math.max(1, element.w - insets.left - insets.right);
      const innerHeight = Math.max(1, element.h - insets.top - insets.bottom);
      const measurement = await measureTextBlock(element.text, innerWidth, style);
      if (measurement.totalHeight > innerHeight * 1.35) {
        warnings.push(`slide ${slideIndex + 1} element ${element.id}: measured text requires substantial shrinking`);
      } else if (measurement.totalHeight > innerHeight) {
        warnings.push(`slide ${slideIndex + 1} element ${element.id}: measured text may exceed its box`);
      }
    }
  }
  return { errors, warnings };
}

export async function assertTextFit(deck) {
  const result = await checkTextFit(deck);
  if (result.errors.length > 0) throw new Error(`Text validation failed:\n${result.errors.join("\n")}`);
  return result;
}
