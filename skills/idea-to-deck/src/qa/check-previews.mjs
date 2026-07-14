import sharp from "sharp";

export async function checkPreviews(paths) {
  const errors = [];
  const warnings = [];
  for (const path of paths) {
    const image = sharp(path);
    const metadata = await image.metadata();
    if (metadata.width !== 3840 || metadata.height !== 2160) {
      errors.push(`${path}: expected 3840x2160, received ${metadata.width}x${metadata.height}`);
    }
    const stats = await image.stats();
    if (stats.isOpaque === false) warnings.push(`${path}: preview contains transparency`);
    const entropy = await image.clone().greyscale().stats().then((value) => value.entropy);
    if (entropy < 0.02) warnings.push(`${path}: preview may be blank or nearly uniform`);
  }
  return { errors, warnings };
}

export async function assertPreviews(paths) {
  const result = await checkPreviews(paths);
  if (result.errors.length > 0) {
    throw new Error(`Preview validation failed:\n${result.errors.join("\n")}`);
  }
  return result;
}
