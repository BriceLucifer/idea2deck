import { copyFile, mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";
import { parseDeckSpec, assertBuildApproved } from "./schema/deck-spec.mjs";
import { assertImages } from "./qa/check-images.mjs";
import { assertLayout } from "./qa/check-layout.mjs";
import { inspectPptx } from "./qa/inspect-pptx.mjs";
import { assertPreviews } from "./qa/check-previews.mjs";
import { renderPptx } from "./pptx/render-pptx.mjs";
import { renderDeckPreviews } from "./preview/render-preview.mjs";
import { renderPdfFromPreviews } from "./pdf/render-pdf.mjs";

export function parseInternalArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--spec") result.spec = argv[++index];
    else if (argv[index] === "--out") result.out = argv[++index];
    else if (argv[index] === "--review-dir") result.reviewDir = argv[++index];
  }
  if (!result.spec) throw new Error("Internal runner requires --spec <path>.");
  result.out ??= resolve("out");
  return result;
}

async function readJson(path) {
  const { readFile } = await import("node:fs/promises");
  return JSON.parse(await readFile(path, "utf8"));
}

export async function assertOutContainsOnlyDeliverables(outDir) {
  const entries = await readdir(outDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || ![".pptx", ".pdf"].includes(extname(entry.name).toLowerCase())) {
      throw new Error(`out/ may contain only final PPTX and PDF files; found ${entry.name}`);
    }
  }
}

export async function buildDeck({ specPath, outDir, reviewDir }) {
  const raw = await readJson(specPath);
  assertBuildApproved(raw);
  const deck = parseDeckSpec(raw);
  const workspace = reviewDir
    ? resolve(reviewDir)
    : await mkdtemp(join(tmpdir(), "idea-to-deck-"));
  const callerOwnsWorkspace = Boolean(reviewDir);
  if (callerOwnsWorkspace) await mkdir(workspace, { recursive: true });
  const resolvedOut = resolve(outDir);
  await mkdir(resolvedOut, { recursive: true });

  try {
    const layoutReport = assertLayout(deck);
    const imageReport = await assertImages(deck);
    const previews = await renderDeckPreviews(deck, workspace);
    const previewReport = await assertPreviews(previews);
    await writeFile(join(workspace, "qa-report.json"), JSON.stringify({ layoutReport, imageReport, previewReport }, null, 2));

    const temporaryPptx = join(workspace, `${deck.deck.slug}.pptx`);
    const temporaryPdf = join(workspace, `${deck.deck.slug}.pdf`);
    await renderPptx(deck, temporaryPptx);
    await inspectPptx(temporaryPptx, deck.slides.length);
    await renderPdfFromPreviews(previews, temporaryPdf);

    const finalPptx = join(resolvedOut, `${deck.deck.slug}.pptx`);
    const finalPdf = join(resolvedOut, `${deck.deck.slug}.pdf`);
    await Promise.all([copyFile(temporaryPptx, finalPptx), copyFile(temporaryPdf, finalPdf)]);
    await assertOutContainsOnlyDeliverables(resolvedOut);
    return { pptx: finalPptx, pdf: finalPdf, reviewDir: callerOwnsWorkspace ? workspace : undefined };
  } finally {
    if (!callerOwnsWorkspace) await rm(workspace, { recursive: true, force: true });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseInternalArgs(process.argv.slice(2));
  buildDeck({ specPath: resolve(args.spec), outDir: resolve(args.out), reviewDir: args.reviewDir })
    .then((files) => process.stdout.write(`${JSON.stringify(files)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
