---
name: idea-to-deck
description: Convert ideas and multimodal source material into polished, editable 16:9 PowerPoint presentations and coordinated high-quality PDFs. Use when Codex needs to create, redesign, or rebuild a deck from text, Markdown, images, PDFs, DOCX files, or existing PPTX files; inspect sources read-only; present an inferred brief and slide plan for explicit approval; optionally use subagents and image generation; render native content with PptxGenJS; and perform deterministic plus visual QA. Rebuild existing PPTX files as new decks instead of editing their objects in place.
---

# Idea to Deck

## Outcome

Turn the user's materials into an approved deck story, an editable PowerPoint, and a coordinated PDF. For a complete request, present one combined Brief + Deck Plan, ask once for build approval, then build autonomously. Ask a separate kickoff only when a material decision is genuinely missing.

Default to the user's language, a 16:9 canvas, ten slides, editable native content, high-quality raster assets, and final output in `<current-workspace>/out`.

## Adaptive approval flow

Every new deck requires explicit approval of a displayed Deck Plan before building.

### Read-only triage

Inspect the prompt and relevant available sources only far enough to determine whether the brief is complete and to shape a credible plan. Preserve originals. Use a task-local system temporary directory for any necessary extracts and remove it if planning is cancelled.

Do not install dependencies, generate images, author DeckSpec, render files, or write to `out/` during triage.

Treat the brief as complete when the objective and audience are clear or safely inferable; context, length, and visual direction are supplied or covered by sensible defaults; and no inaccessible source or contradiction blocks planning.

### Complete request

Present a combined Brief + Deck Plan containing:

- objective, audience, language, and presentation context
- visual direction and slide count
- source summary and intended use
- slide-by-slide title, purpose, and key message
- planned image generation, or `none`
- subagents enabled or disabled
- editable PPTX and coordinated high-quality PDF deliverables

Show `Subagents: disabled` by default and invite the user to enable specific proposed lanes in the same reply. End with: `Reply "approve and build" to use this plan, or send changes. If your changes are final, end with "build with these changes."`

Stop and wait. Treat only explicit approval of the displayed plan as permission to build.

### Incomplete request

Ask at most three compact questions about only the missing material decisions. Include inferred defaults so `use the defaults` is a valid reply. Then present the combined Brief + Deck Plan and wait for approval.

If the user gives unambiguous revisions and explicitly says `build with these changes`, update the plan and proceed without another mechanical confirmation. Corrections without an instruction to build are not approval.

Do not ask for individual slide, image, or repair approval unless a new decision materially changes the approved direction.
Do not repeat triage or approval for revisions to the same deck; resume from the earliest affected stage.

## Visible progress

Keep one visible plan with these stages:

1. Confirming the brief.
2. Understanding the materials.
3. Shaping the Deck Plan.
4. Designing and rendering the slides.
5. Reviewing and delivering the files.

Complete stages 1–3 before Deck Plan approval. Continue with stages 4–5 only after approval. Mark a stage complete only when its real decision or artifact exists.

## Source analysis

During read-only triage, extract the objective, audience, argument, evidence, desired tone, brand constraints, and presentation setting. Distinguish supplied facts, user claims, model inference, and proposed framing.

Route source formats through the most relevant installed capability:

- read text and Markdown directly
- inspect supplied images visually
- use the PDF skill for PDF sources when available
- use the Documents skill for DOCX sources when available
- use the Presentations skill for existing PPTX sources when available

Read [references/source-handling.md](references/source-handling.md) whenever files, URLs, several sources, or an existing deck are involved. Preserve every original source unchanged.

Read [references/narrative-patterns.md](references/narrative-patterns.md) only when a known presentation type helps shape the story. Use its patterns as options, not fixed templates.

## Optional subagents

Use subagents only when the approved Deck Plan explicitly enables named lanes or the user directly requests them. Read [references/subagents.md](references/subagents.md) before delegation.

Keep the main agent responsible for user interaction, Deck Plan, DeckSpec, image decisions, rendering, repair, cleanup, and final delivery. Continue in single-agent mode when subagents are unavailable.

## Build after approval

After explicit Deck Plan approval:

1. Resolve `SKILL_DIR` as the folder containing this file.
2. Read [references/runtime.md](references/runtime.md) and check runtime readiness.
3. Create a dedicated system temporary directory.
4. Read [references/deck-spec.md](references/deck-spec.md).
5. Convert the approved plan into DeckSpec version `1.0` using the executable schema.
6. Record approval, source provenance, deterministic coordinates, editability, and a lowercase hyphenated deck slug.
7. Read [references/visual-direction.md](references/visual-direction.md) and build one clear composition per slide.
8. Read [references/layout-components.md](references/layout-components.md) when the deck contains repeated cards, flows, or node-link diagrams.
9. Generate only the original raster artwork specified in the approved plan.
10. Run the bundled DeckSpec preflight exactly as documented in `runtime.md`; do not invent validation imports.
11. Render the editable PPTX, 4K preview pages, coordinated PDF, and temporary QA reports.
12. Read [references/qa-rubric.md](references/qa-rubric.md), inspect every preview, and repair the smallest failing scope.
13. Re-run preflight and rendering after each repair.
14. Verify the current output pair, clean temporary artifacts, and verify that cleanup succeeded.

Keep DeckSpec, source extracts, generated assets, previews, QA reports, logs, and caches outside `out/`.

## Content and visual guardrails

- Give every slide one communication purpose and one dominant conclusion or composition.
- Adapt the narrative to the audience instead of forcing a universal slide sequence.
- Keep claims faithful to their sources; never invent evidence, quotations, metrics, customers, or citations.
- Split overloaded slides before shrinking type.
- Keep text, tables, charts, and simple shapes native and editable.
- Use raster images only for photographs, textures, generated artwork, and complex visual scenes.
- Use `$imagegen` only when original artwork materially improves communication.
- Do not generate charts, tables, typography, UI, precise diagrams, or decorative filler as images.

## Review and repair

Deterministic checks are necessary but not sufficient. Inspect every 3840x2160 preview for message clarity, hierarchy, alignment, spacing, text wrapping, contrast, crop safety, image quality, consistency, and narrative pacing. The PDF uses these reviewed 4K pages; the editable PPTX uses native Office objects. Treat them as coordinated outputs from the same DeckSpec, not as guaranteed pixel-identical renders.

Repair local defects without regenerating the whole deck. Rebuild and recheck after each repair. Stop after two unsuccessful automatic correction passes and report the exact blocker and affected slides.

## Delivery contract

Before delivery, confirm:

- the PPTX and PDF exist and have matching slide counts, order, and 16:9 proportions
- native text, tables, charts, and simple shapes remain editable
- no blocking layout, image, contrast, crop, overflow, or consistency defect remains
- the current deck slug owns exactly one final `.pptx` and one final `.pdf`; unrelated files in `out/` remain untouched
- temporary artifacts have been cleaned when safe

Return exactly one link to the final PPTX and one link to the final PDF. State that the deck follows the approved plan and was visually checked. Do not expose DeckSpec, previews, QA JSON, generated-image paths, temporary paths, setup commands, or internal renderer commands.
