---
name: idea-to-deck
description: Convert ideas and multimodal source material into polished, editable 16:9 PowerPoint presentations and matching high-quality PDFs. Use when Codex needs to create, redesign, or rebuild a deck from text, Markdown, images, PDFs, DOCX files, or existing PPTX files; begin every new deck with a short user kickoff; agree on a slide plan; optionally use subagents and image generation; render native content with PptxGenJS; and perform visual QA. Rebuild existing PPTX files as new decks instead of editing their objects in place.
---

# Idea to Deck

## Outcome

Turn the user's materials into an approved deck story, an editable PowerPoint, and a visually matching PDF. Keep the interaction simple: ask one short kickoff, propose one Deck Plan, wait for approval, build autonomously, visually check the result, and deliver two files.

Default to the user's language, a 16:9 canvas, ten slides, editable native content, high-quality raster assets, and final output in `<current-workspace>/out`.

## Mandatory interaction gates

Never build a new deck directly from the initial request. Every new deck task must pass both gates below.

### Gate 1: kickoff confirmation

Before planning or building, ask the user one concise kickoff question. Do not skip this gate even when the initial request appears complete.

Infer sensible answers from the prompt and sources, then ask the user to confirm or correct:

```text
Before I plan the deck, please confirm or correct:

1. Objective and audience: <inferred answer>
2. Presentation context and length: <inferred answer>
3. Visual direction: <inferred answer>
4. Optional subagents: yes or no

Reply "use these defaults" or change any item.
```

Use a structured user-input tool when one is available; otherwise ask in plain text. Ask no more than four compact items. When the user already supplied an answer, show it for confirmation instead of asking them to repeat it.

Stop and wait for the reply. Do not inspect unnecessary sources, create DeckSpec, install dependencies, generate images, or render files before this response.

Do not repeat the kickoff for revisions to the same deck. Resume from the earliest affected workflow stage instead.

### Gate 2: Deck Plan approval

After the kickoff response and source analysis, present a concise Deck Plan containing:

- objective, audience, language, and presentation context
- visual direction and slide count
- source summary and intended use
- slide-by-slide title, purpose, and key message
- planned image generation, or `none`
- subagents enabled or disabled
- editable PPTX and matching PDF deliverables

End by asking the user to approve or revise the Deck Plan. Stop and wait. Treat only an explicit approval as permission to build.

Do not ask for individual slide, image, or repair approval unless a new decision materially changes the approved direction.

## Visible progress

Keep one visible plan with these stages:

1. Confirming the brief.
2. Understanding the materials.
3. Shaping the Deck Plan.
4. Designing and rendering the slides.
5. Reviewing and delivering the files.

Complete stages 1–3 before Deck Plan approval. Continue with stages 4–5 only after approval. Mark a stage complete only when its real decision or artifact exists.

## Source analysis

After kickoff confirmation, read the prompt and relevant sources. Extract the objective, audience, argument, evidence, desired tone, brand constraints, and presentation setting. Distinguish supplied facts, user claims, model inference, and proposed framing.

Route source formats through the most relevant installed capability:

- read text and Markdown directly
- inspect supplied images visually
- use the PDF skill for PDF sources when available
- use the Documents skill for DOCX sources when available
- use the Presentations skill for existing PPTX sources when available

Read [references/source-handling.md](references/source-handling.md) whenever files, URLs, several sources, or an existing deck are involved. Preserve every original source unchanged.

Read [references/narrative-patterns.md](references/narrative-patterns.md) only when a known presentation type helps shape the story. Use its patterns as options, not fixed templates.

## Optional subagents

Use subagents only when the user enables them during kickoff. Read [references/subagents.md](references/subagents.md) before delegation.

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
8. Generate only the original raster artwork specified in the approved plan.
9. Render the editable PPTX, 4K preview pages, matching PDF, and temporary QA reports.
10. Read [references/qa-rubric.md](references/qa-rubric.md), inspect every preview, and repair the smallest failing scope.
11. Verify final files and clean temporary artifacts.

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

Deterministic checks are necessary but not sufficient. Inspect every 3840x2160 preview for message clarity, hierarchy, alignment, spacing, text wrapping, contrast, crop safety, image quality, consistency, and narrative pacing.

Repair local defects without regenerating the whole deck. Rebuild and recheck after each repair. Stop after two unsuccessful automatic correction passes and report the exact blocker and affected slides.

## Delivery contract

Before delivery, confirm:

- the PPTX and PDF exist and have matching slide counts, order, and 16:9 proportions
- native text, tables, charts, and simple shapes remain editable
- no blocking layout, image, contrast, crop, overflow, or consistency defect remains
- `out/` contains only final `.pptx` and `.pdf` deliverables
- temporary artifacts have been cleaned when safe

Return exactly one link to the final PPTX and one link to the final PDF. State that the deck follows the approved plan and was visually checked. Do not expose DeckSpec, previews, QA JSON, generated-image paths, temporary paths, setup commands, or internal renderer commands.
