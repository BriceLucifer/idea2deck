import { z } from "zod";
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from "../shared/layout.mjs";

const box = {
  x: z.number().finite().nonnegative(),
  y: z.number().finite().nonnegative(),
  w: z.number().finite().positive(),
  h: z.number().finite().positive(),
};

const common = {
  id: z.string().min(1),
  ...box,
  zIndex: z.number().int().default(1),
  allowOverlap: z.boolean().default(false),
  sourceId: z.string().optional(),
  editable: z.boolean().default(true),
};

const textElement = z.object({
  type: z.literal("text"),
  ...common,
  text: z.string(),
  style: z.object({
    fontFace: z.string().optional(),
    fontSize: z.number().positive().default(28),
    color: z.string().optional(),
    bold: z.boolean().default(false),
    italic: z.boolean().default(false),
    align: z.enum(["left", "center", "right"]).default("left"),
    valign: z.enum(["top", "mid", "bottom"]).default("top"),
    margin: z.number().nonnegative().default(0),
    breakLine: z.boolean().default(false),
  }).default({}),
});

const imageElement = z.object({
  type: z.literal("image"),
  ...common,
  path: z.string().min(1),
  alt: z.string().default(""),
  fit: z.enum(["cover", "contain"]).default("cover"),
  allowUpscale: z.boolean().default(false),
  editable: z.boolean().default(false),
});

const tableElement = z.object({
  type: z.literal("table"),
  ...common,
  rows: z.array(z.array(z.union([z.string(), z.number()]))).min(1),
  headerRows: z.number().int().nonnegative().default(1),
  style: z.object({
    fontSize: z.number().positive().default(18),
    color: z.string().optional(),
    headerFill: z.string().optional(),
    borderColor: z.string().optional(),
  }).default({}),
});

const chartElement = z.object({
  type: z.literal("chart"),
  ...common,
  chartType: z.enum(["bar", "column", "line", "pie", "doughnut"]),
  categories: z.array(z.string()).min(1),
  series: z.array(z.object({
    name: z.string(),
    values: z.array(z.number()),
    color: z.string().optional(),
  })).min(1),
  showLegend: z.boolean().default(true),
});

const shapeElement = z.object({
  type: z.literal("shape"),
  ...common,
  shape: z.enum(["rect", "roundRect", "ellipse", "line"]),
  fill: z.string().optional(),
  stroke: z.string().optional(),
  strokeWidth: z.number().nonnegative().default(1),
  radius: z.number().nonnegative().default(0),
  flipH: z.boolean().default(false),
  flipV: z.boolean().default(false),
});

export const elementSchema = z.discriminatedUnion("type", [
  textElement,
  imageElement,
  tableElement,
  chartElement,
  shapeElement,
]);

export const deckSpecSchema = z.object({
  version: z.literal("1.0"),
  approval: z.object({
    confirmed: z.literal(true),
    confirmedAt: z.string().datetime(),
    summary: z.string().min(1),
  }),
  deck: z.object({
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string().min(1),
    audience: z.string().min(1),
    language: z.string().min(2),
    objective: z.string().min(1),
    aspectRatio: z.literal("16:9").default("16:9"),
    width: z.literal(LOGICAL_WIDTH).default(LOGICAL_WIDTH),
    height: z.literal(LOGICAL_HEIGHT).default(LOGICAL_HEIGHT),
    quality: z.literal("high").default("high"),
    theme: z.object({
      background: z.string().optional(),
      foreground: z.string().optional(),
      muted: z.string().optional(),
      accent: z.string().optional(),
      accent2: z.string().optional(),
      fontHeading: z.string().optional(),
      fontBody: z.string().optional(),
    }).default({}),
  }),
  sources: z.array(z.object({
    id: z.string().min(1),
    kind: z.enum(["text", "markdown", "image", "pdf", "docx", "pptx", "other"]),
    path: z.string().optional(),
    description: z.string().min(1),
    usage: z.string().min(1),
    provenance: z.string().min(1),
  })).default([]),
  slides: z.array(z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    purpose: z.string().min(1),
    speakerNotes: z.string().default(""),
    background: z.string().optional(),
    elements: z.array(elementSchema),
  })).min(1).max(40),
});

export function parseDeckSpec(input) {
  return deckSpecSchema.parse(input);
}

export function validateDeckSpec(input) {
  const result = deckSpecSchema.safeParse(input);
  if (result.success) return { valid: true, errors: [], deck: result.data };
  return {
    valid: false,
    errors: result.error.issues.map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "<root>";
      return `${path}: ${issue.message}`;
    }),
  };
}

export function assertBuildApproved(input) {
  if (input?.approval?.confirmed !== true) {
    throw new Error("Deck plan approval is required before rendering.");
  }
}
