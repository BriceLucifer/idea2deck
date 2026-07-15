import sharp from "sharp";
import { ptToLogicalPx } from "./layout.mjs";

const widthCache = new Map();

export function fontPx(points) {
  return ptToLogicalPx(points);
}

export function textInsets(style = {}) {
  const logicalMargin = ptToLogicalPx(style.margin ?? 0);
  return { left: logicalMargin, right: logicalMargin, top: logicalMargin, bottom: logicalMargin };
}

function escapePango(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function fontDescription(style = {}) {
  const face = style.fontFace || "Arial";
  const traits = [style.bold ? "Bold" : "", style.italic ? "Italic" : ""].filter(Boolean).join(" ");
  return `${face}${traits ? ` ${traits}` : ""} ${fontPx(style.fontSize ?? 28)}`;
}

function fallbackWidth(text, style = {}) {
  const size = fontPx(style.fontSize ?? 28);
  return Array.from(String(text)).reduce((total, character) => {
    if (/\s/u.test(character)) return total + size * 0.3;
    if (/\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Hangul}/u.test(character)) return total + size;
    if (/[A-Z0-9]/u.test(character)) return total + size * 0.62;
    if (/[a-z]/u.test(character)) return total + size * 0.52;
    return total + size * 0.48;
  }, 0);
}

export async function measureTextWidth(text, style = {}) {
  const value = String(text);
  if (!value) return 0;
  const key = `${fontDescription(style)}\u0000${value}`;
  if (widthCache.has(key)) return widthCache.get(key);
  let width;
  try {
    const metadata = await sharp({
      text: { text: escapePango(value), font: fontDescription(style), rgba: true },
    }).metadata();
    width = metadata.width ?? fallbackWidth(value, style);
  } catch {
    width = fallbackWidth(value, style);
  }
  widthCache.set(key, width);
  return width;
}

function wordTokens(text) {
  if (typeof Intl.Segmenter !== "function") return String(text).split(/(\s+)/u).filter(Boolean);
  return Array.from(new Intl.Segmenter(undefined, { granularity: "word" }).segment(String(text)), (part) => part.segment);
}

function graphemes(text) {
  if (typeof Intl.Segmenter !== "function") return Array.from(String(text));
  return Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(String(text)), (part) => part.segment);
}

async function breakLongToken(token, maxWidth, style) {
  const chunks = [];
  let current = "";
  for (const character of graphemes(token)) {
    const candidate = current + character;
    if (current && await measureTextWidth(candidate, style) > maxWidth) {
      chunks.push(current);
      current = character;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export async function wrapTextMeasured(text, maxWidth, style = {}) {
  const lines = [];
  for (const paragraph of String(text).split("\n")) {
    if (!paragraph) {
      lines.push("");
      continue;
    }
    const tokens = wordTokens(paragraph);
    let current = "";
    for (const originalToken of tokens) {
      const pieces = await measureTextWidth(originalToken, style) > maxWidth
        ? await breakLongToken(originalToken, maxWidth, style)
        : [originalToken];
      for (const token of pieces) {
        if (!current && /^\s+$/u.test(token)) continue;
        const candidate = current + token;
        if (current.trim() && await measureTextWidth(candidate, style) > maxWidth) {
          lines.push(current.trimEnd());
          current = token.trimStart();
        } else {
          current = candidate;
        }
      }
    }
    if (current || lines.length === 0) lines.push(current.trimEnd());
  }
  return lines.length > 0 ? lines : [""];
}

export async function measureTextBlock(text, maxWidth, style = {}) {
  const lines = await wrapTextMeasured(text, maxWidth, style);
  const lineHeight = fontPx(style.fontSize ?? 28) * (style.lineHeight ?? 1.15);
  return { lines, lineHeight, totalHeight: lines.length * lineHeight };
}
