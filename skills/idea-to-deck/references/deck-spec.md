# DeckSpec Contract

Read this reference after Deck Plan approval and before authoring DeckSpec.

The executable schema in `src/schema/deck-spec.mjs` is authoritative. This reference explains intent and does not override the schema.

## Top-level model

```text
version
approval
deck
sources[]
slides[]
  elements[]
```

## Approval

Set `approval.confirmed` only after explicit user approval. Record an ISO timestamp and a concise summary of the approved objective, outline, length, and visual direction. Never fabricate approval to satisfy the renderer.

## Deck

Use:

- `aspectRatio: "16:9"`
- `width: 1920`
- `height: 1080`
- `quality: "high"`
- a lowercase hyphenated slug
- the user's language or the explicitly requested language
- a theme that can be applied consistently across native PPTX and preview rendering

## Sources

Give each source a stable id. Record:

- source kind
- original path when available
- human-readable description
- intended use
- provenance or origin

Attach `sourceId` to elements containing claims, excerpts, data, or sourced imagery whenever possible. Do not use provenance fields to imply independent verification that did not occur.

## Slides

Give each slide:

- a stable id
- a meaningful title
- one communication purpose
- speaker notes when useful
- a background when it differs from the deck default
- a deterministic element stack

## Elements

Supported types are `text`, `image`, `table`, `chart`, and `shape`.

Every element needs exact logical coordinates, positive dimensions, a stable id, a z-index, an overlap policy, and an editability policy.

- Keep text, tables, charts, and simple shapes editable.
- Mark raster images non-editable.
- Use `allowOverlap` only for deliberate, visually reviewed compositions.
- Keep all boxes inside 1920x1080.
- Use `cover` only when cropping is intentional and safe.
- Use `contain` when the full source image must remain visible.
- For `shape: "line"`, `x/y/w/h` define a positive bounding box. Use `flipV: true` for a bottom-left to top-right line and `flipH: true` to reverse the horizontal direction. Never use negative dimensions.
- Place connector endpoints on the actual target boundaries; do not approximate a diagram with visibly floating or broken segments.

## Authoring order

Author each slide in this order:

1. state its purpose and conclusion
2. choose one dominant composition
3. place the primary message
4. place supporting evidence
5. add only necessary navigation, source notes, or decoration
6. verify source mapping and editability
7. check bounds and likely text fit before rendering

Prefer removing or splitting content over compressing it into an unreadable layout.
