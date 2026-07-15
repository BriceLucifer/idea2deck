import { access, copyFile, mkdir, mkdtemp, rename, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { parseDeckSpec, assertBuildApproved } from "./schema/deck-spec.mjs";
import { assertImages } from "./qa/check-images.mjs";
import { assertLayout } from "./qa/check-layout.mjs";
import { inspectPptx } from "./qa/inspect-pptx.mjs";
import { assertPreviews } from "./qa/check-previews.mjs";
import { assertTextFit } from "./qa/check-text.mjs";
import { inspectPdf } from "./qa/inspect-pdf.mjs";
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

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function assertCurrentDeliverables(outDir, slug) {
  const files = [`${slug}.pptx`, `${slug}.pdf`];
  for (const file of files) {
    const info = await stat(join(outDir, file));
    if (!info.isFile() || info.size === 0) throw new Error(`Final deliverable is missing or empty: ${file}`);
  }
  return files;
}

async function publishPair({ temporaryPptx, temporaryPdf, finalPptx, finalPdf, outDir }) {
  const stage = await mkdtemp(join(outDir, ".idea-to-deck-publish-"));
  const stagedPptx = join(stage, "deck.pptx");
  const stagedPdf = join(stage, "deck.pdf");
  const backupPptx = join(stage, "previous.pptx");
  const backupPdf = join(stage, "previous.pdf");
  try {
    await Promise.all([copyFile(temporaryPptx, stagedPptx), copyFile(temporaryPdf, stagedPdf)]);
    if (await exists(finalPptx)) await rename(finalPptx, backupPptx);
    if (await exists(finalPdf)) await rename(finalPdf, backupPdf);
    await rename(stagedPptx, finalPptx);
    await rename(stagedPdf, finalPdf);
  } catch (error) {
    await rm(finalPptx, { force: true });
    await rm(finalPdf, { force: true });
    if (await exists(backupPptx)) await rename(backupPptx, finalPptx);
    if (await exists(backupPdf)) await rename(backupPdf, finalPdf);
    throw error;
  } finally {
    await rm(stage, { recursive: true, force: true });
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
    const textReport = await assertTextFit(deck);
    const previews = await renderDeckPreviews(deck, workspace);
    const previewReport = await assertPreviews(previews);
    await writeFile(join(workspace, "qa-report.json"), JSON.stringify({ layoutReport, imageReport, textReport, previewReport }, null, 2));

    const temporaryPptx = join(workspace, `${deck.deck.slug}.pptx`);
    const temporaryPdf = join(workspace, `${deck.deck.slug}.pdf`);
    await renderPptx(deck, temporaryPptx);
    const pptxReport = await inspectPptx(temporaryPptx, deck.slides.length, deck);
    await renderPdfFromPreviews(previews, temporaryPdf, {
      title: deck.deck.title,
      subject: deck.deck.objective,
      author: "idea-to-deck Codex skill",
    });
    const pdfReport = await inspectPdf(temporaryPdf, deck.slides.length);

    const finalPptx = join(resolvedOut, `${deck.deck.slug}.pptx`);
    const finalPdf = join(resolvedOut, `${deck.deck.slug}.pdf`);
    await publishPair({ temporaryPptx, temporaryPdf, finalPptx, finalPdf, outDir: resolvedOut });
    await assertCurrentDeliverables(resolvedOut, deck.deck.slug);
    return {
      pptx: finalPptx,
      pdf: finalPdf,
      reviewDir: callerOwnsWorkspace ? workspace : undefined,
      warnings: [...layoutReport.warnings, ...imageReport.warnings, ...textReport.warnings, ...previewReport.warnings],
      pptxReport,
      pdfReport,
    };
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
