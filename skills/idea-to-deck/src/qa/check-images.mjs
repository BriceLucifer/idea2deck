import sharp from "sharp";
import { HIGH_QUALITY_SCALE } from "../shared/layout.mjs";

export async function checkImages(deck) {
  const errors = [];
  const warnings = [];

  for (const [slideIndex, slide] of deck.slides.entries()) {
    for (const element of slide.elements.filter((item) => item.type === "image")) {
      const label = `slide ${slideIndex + 1} image ${element.id}`;
      if (/^https?:\/\//i.test(element.path)) {
        errors.push(`${label}: remote images must be downloaded to a local temporary path first`);
        continue;
      }
      try {
        const metadata = await sharp(element.path).metadata();
        if (!metadata.width || !metadata.height) {
          errors.push(`${label}: dimensions could not be read`);
          continue;
        }
        const requiredWidth = Math.ceil(element.w * HIGH_QUALITY_SCALE);
        const requiredHeight = Math.ceil(element.h * HIGH_QUALITY_SCALE);
        if (!element.allowUpscale && (metadata.width < requiredWidth || metadata.height < requiredHeight)) {
          errors.push(
            `${label}: ${metadata.width}x${metadata.height} is below the ${requiredWidth}x${requiredHeight} high-quality target`,
          );
        }
        if (metadata.space && !["srgb", "rgb", "b-w"].includes(metadata.space)) {
          warnings.push(`${label}: color space ${metadata.space} may render inconsistently`);
        }
      } catch (error) {
        errors.push(`${label}: unreadable image (${error.message})`);
      }
    }
  }

  return { errors, warnings };
}

export async function assertImages(deck) {
  const result = await checkImages(deck);
  if (result.errors.length > 0) {
    throw new Error(`Image validation failed:\n${result.errors.join("\n")}`);
  }
  return result;
}
