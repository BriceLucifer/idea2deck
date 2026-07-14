# Source Handling

Read this reference when the request includes files, URLs, several sources, or an existing presentation.

## General rules

- Preserve originals unchanged.
- Work from copies or extracted representations in a system temporary directory.
- Distinguish source facts, user claims, model inference, and proposed narrative framing.
- Record where important claims, data, quotations, and images came from.
- Prefer primary and authoritative sources when external verification is required.
- Do not include material merely because it was supplied; use it only when it advances the approved objective.

## Text and Markdown

Extract headings, arguments, evidence, lists, links, image references, and implied hierarchy. Treat Markdown structure as input organization, not as a slide-per-heading instruction.

## Images

Inspect visually before use. Determine subject, relevance, composition, crop tolerance, resolution, background, text or logo content, and source rights information supplied by the user. Do not infer that an image is suitable merely from its filename.

## PDF

Extract text and inspect relevant pages visually. Preserve page references for claims or figures. Do not rasterize an entire PDF into slides unless the user explicitly wants page reproductions.

## DOCX

Extract heading hierarchy, paragraphs, tables, captions, footnotes, and embedded media. Preserve semantic groupings, but redesign the content for presentation rather than copying document pages.

## Existing PPTX

Inspect slide order, wording, notes, charts, tables, imagery, theme cues, and repeated layout patterns. Rebuild a new deck from extracted content and approved visual cues. Preserve the original file and do not promise object-level in-place editing.

## Multiple sources

Create a compact source map before planning:

```text
source id -> what it contains -> authority/confidence -> intended deck use
```

Resolve contradictions explicitly. If the conflict materially affects the deck, ask the user; otherwise choose the more authoritative or recent source and record the decision.

## Missing provenance

Use neutral wording and mark uncertainty. Do not invent citations, dates, authorship, customer names, or verification status.
