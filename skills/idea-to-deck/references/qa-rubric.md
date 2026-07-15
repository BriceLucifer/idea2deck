# Deck QA Rubric

Read this reference before accepting any final build.

## Blocking deterministic defects

- invalid DeckSpec or missing approval
- missing, unreadable, or damaged asset
- element outside the logical canvas
- invalid PPTX archive or unexpected slide count
- missing final PPTX or PDF
- page count or order mismatch
- non-deliverable file inside `out/`

## Visual review per slide

### Message

- The purpose is immediately understandable.
- The title and evidence agree.
- No unsupported claim is presented as fact.
- Content density suits projected viewing.

### Hierarchy

- The primary message is visually dominant.
- Reading order is unambiguous.
- Supporting material remains subordinate.
- Repeated navigation or decoration does not compete with content.

### Layout

- Alignment and spacing appear intentional.
- No accidental overlap, clipping, crowding, or edge collision remains.
- Diagram connectors terminate cleanly on their intended nodes in both directions.
- Text wraps naturally inside its box.
- The composition feels balanced at full-slide scale.

### Typography and contrast

- Type is legible at presentation distance.
- Contrast is sufficient against the actual background.
- Emphasis styles are consistent.
- Source notes remain readable.

### Images

- Effective resolution is sufficient for the 4K review surface.
- Crop preserves the important subject.
- No stretching, generation artifact, accidental text, or inconsistent visual style remains.
- Decorative imagery does not displace necessary evidence.

### Data

- Charts and tables match the source values.
- Labels, units, scales, dates, and legends are clear.
- Visual emphasis supports the stated conclusion without misleading encoding.

## Across-deck review

- Narrative progresses without unexplained jumps or repetition.
- Visual system is consistent but not mechanically repetitive.
- Section transitions and pacing feel deliberate.
- Similar elements use consistent treatment.
- PPTX and PDF represent the same slide sequence.

## Repair priority

Fix in this order:

1. factual or source error
2. missing or contradictory message
3. overflow, clipping, bounds, or broken asset
4. unreadable hierarchy or contrast
5. unsafe crop or weak composition
6. cross-slide inconsistency
7. minor polish

Warnings require visual judgment. Errors block delivery. Two unsuccessful automatic correction passes require a concise blocker report rather than endless iteration.
