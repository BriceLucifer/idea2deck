import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { assertBuildApproved, parseDeckSpec } from "./schema/deck-spec.mjs";
import { assertImages } from "./qa/check-images.mjs";
import { assertLayout } from "./qa/check-layout.mjs";

function parseArgs(argv) {
  const specIndex = argv.indexOf("--spec");
  if (specIndex === -1 || !argv[specIndex + 1]) {
    throw new Error("Internal validator requires --spec <path>.");
  }
  return { spec: resolve(argv[specIndex + 1]) };
}

export async function validateSpecFile(specPath) {
  const raw = JSON.parse(await readFile(specPath, "utf8"));
  assertBuildApproved(raw);
  const deck = parseDeckSpec(raw);
  const layout = assertLayout(deck);
  const images = await assertImages(deck);
  return {
    valid: true,
    slides: deck.slides.length,
    elementCounts: deck.slides.map((slide) => slide.elements.length),
    warnings: [...layout.warnings, ...images.warnings],
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2));
  validateSpecFile(args.spec)
    .then((report) => process.stdout.write(`${JSON.stringify(report)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
