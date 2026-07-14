---
name: idea-to-deck
description: Convert ideas and multimodal source material into polished, editable 16:9 PowerPoint presentations and matching high-quality PDFs. Use when Codex needs to create, redesign, or rebuild a slide deck from text, Markdown, images, PDFs, DOCX files, or existing PPTX files; collaborate with the user on a deck plan; optionally generate original raster artwork; render native editable content with PptxGenJS; and perform deterministic plus visual QA. Rebuild existing PPTX files as new decks instead of editing their objects in place.
---

# Idea to Deck

## Overview

Turn the user's ideas and sources into an approved narrative plan, then build an editable PowerPoint and a visually matching PDF. Keep the user experience simple: understand the material, propose one Deck Plan, wait for one approval, build autonomously, repair the smallest failing scope, and deliver two final files.

Default to:

- the language used by the user
- a 16:9 canvas
- editable native text, tables, charts, and simple shapes
- high-quality raster assets only where they improve communication
- ten slides when the user gives no slide-count preference
- speaker notes when they add presentation value
- `<current-workspace>/out` for final deliverables
- system temporary directories for all intermediate artifacts

Keep the workflow strict and the content adaptive. Do not force every deck into one narrative template, visual style, or slide sequence.

## Runtime and storage

Resolve `SKILL_DIR` as the directory containing this `SKILL.md`.

Use these locations:

```text
Runtime entry:  <SKILL_DIR>/src/run.mjs
Runtime setup:  <SKILL_DIR>/scripts/setup.mjs
Schema:         <SKILL_DIR>/src/schema/deck-spec.mjs
Final output:   <current-workspace>/out
Intermediates:  <system-temp>/idea-to-deck-<task-id>/
```

Never write user deliverables into the installed Skill directory. Never write DeckSpec, source extracts, generated assets, previews, QA reports, logs, or caches into `out/`.

Treat the internal runner as an implementation detail. Do not present it as a user-facing CLI.

## Runtime readiness

Before the first build in an installation, check the runtime:

```bash
node "$SKILL_DIR/scripts/setup.mjs" --check
```

If dependencies are missing, explain that the local PptxGenJS runtime needs a one-time dependency installation and ask for permission before running:

```bash
node "$SKILL_DIR/scripts/setup.mjs" --install
```

Do not install dependencies before Deck Plan approval merely to inspect sources or prepare the plan. Require Node.js 20 or newer. Do not commit or distribute `node_modules`.

## Non-negotiable interaction contract

- Never render before the user explicitly approves the Deck Plan.
- Do not treat the initial creation request as approval.
- Ask only questions whose answers materially change the result.
- Combine missing-information questions and the subagent choice into one message.
- Do not ask the user to approve individual slides, generated images, or repair passes unless a new decision materially changes the approved direction.
- Never start subagents unless the user opts in for the current deck.
- Preserve all supplied source files unchanged.
- Rebuild an existing PPTX into a new file; do not promise in-place object editing.
- Deliver only the final PPTX and PDF unless the user explicitly asks for internal artifacts.

## Capability delegation

Use the most relevant installed capability for each source:

- Read plain text and Markdown directly.
- Inspect every supplied image visually before using it.
- Use the PDF skill to read or visually inspect PDF sources when available.
- Use the Documents skill for DOCX sources when available.
- Use the Presentations skill to inspect existing PPTX sources when available.
- Use `$imagegen` only for original raster artwork that materially improves the deck.

Do not duplicate another Skill's workflow in this file. Let the delegated Skill own its format-specific parsing, rendering, or generation rules.

Read [references/source-handling.md](references/source-handling.md) when the request contains files, URLs, several sources, or an existing deck.

## Visible progress

Keep one visible progress plan for the task:

1. Understanding the materials.
2. Shaping the deck story.
3. Designing the slides.
4. Rendering and checking the deck.
5. Delivering the final files.

Before approval, complete only the first two steps. After approval, continue with the remaining steps. Mark a step complete only when its real decision or artifact exists.

For a revision request, resume from the earliest affected step instead of restarting the entire workflow.

## Phase 1: understand the request

1. Read the user's prompt and all supplied sources.
2. Extract the objective, audience, language, core argument, evidence, presentation setting, desired tone, brand constraints, requested length, and delivery expectations.
3. Distinguish supplied facts from user opinions, model inference, and proposed framing.
4. Infer reasonable defaults when the missing information will not materially change the result.
5. Ask at most three concise questions when critical information is missing.
6. Ask whether the user wants optional subagents for parallel source analysis, narrative review, and final visual QA. Skip this question when the user already gave a clear preference.
7. Summarize how each source will be used. Do not promise to use every supplied item visually.

Read [references/narrative-patterns.md](references/narrative-patterns.md) only when a known presentation type would help structure the story. Treat its patterns as starting points, never mandatory templates.

## Phase 2: present the Deck Plan

Present a concise Deck Plan with:

```text
Objective
Audience
Language
Presentation context
Visual direction
Slide count
Subagents: enabled | disabled

Sources
- source -> intended use

Slides
1. title -> purpose -> key message
2. title -> purpose -> key message
...

Planned image generation
- slide -> asset -> communication purpose
- or: none

Deliverables
- editable PPTX
- matching PDF
```

Use assertion-style titles when appropriate, so the outline communicates the argument rather than listing generic topics. Keep enough detail for the user to judge the story without exposing DeckSpec coordinates or implementation details.

End by asking the user to approve or revise the Deck Plan. Stop the turn. Do not create DeckSpec, generate images, install runtime dependencies, or render files yet.

## Optional subagent pipeline

Use this section only after explicit opt-in for the current deck.

Use no more than three bounded subagents:

- **Source analyst:** extract facts, evidence, themes, and provenance from heterogeneous inputs.
- **Narrative critic:** challenge argument order, audience fit, density, missing evidence, and redundancy.
- **Visual QA reviewer:** inspect final preview images against the approved visual direction.

Keep all delegated lanes read-only. Do not let subagents modify DeckSpec, write to `out/`, run competing renderers, or independently deliver a deck. Give them raw sources and minimum necessary context without presenting the parent's conclusions as ground truth.

The parent agent must reconcile findings, own DeckSpec, decide image generation, run the renderer, repair defects, clean temporary artifacts, and deliver the files. If subagents are unavailable after opt-in, continue in single-agent mode and state that limitation briefly.

## Phase 3: prepare the build

After explicit approval:

1. Resolve `SKILL_DIR` and the current workspace.
2. Check runtime readiness and install dependencies only if required and permitted.
3. Create a dedicated system temporary directory.
4. Read [references/deck-spec.md](references/deck-spec.md).
5. Convert the approved plan into DeckSpec version `1.0` using the executable Zod schema.
6. Set `approval.confirmed` to `true`, record the confirmation timestamp, and summarize what was approved.
7. Give the deck a lowercase hyphenated slug.
8. Record every source with its kind, intended use, and provenance.
9. Associate extracted claims and assets with `sourceId` whenever possible.
10. Keep the DeckSpec and all generated assets in the task temporary directory.

Use the 1920x1080 logical canvas. Give every element deterministic `x`, `y`, `w`, `h`, `zIndex`, editability, and source metadata.

## Content and narrative rules

- Give every slide one clear communication purpose.
- Prefer one dominant conclusion or composition per slide.
- Write titles that reveal the point when the evidence supports it.
- Preserve a coherent argument across slides instead of producing disconnected summaries.
- Split overloaded slides before shrinking type.
- Remove low-value content instead of filling every available region.
- Keep claims faithful to their sources and label inference when needed.
- Never invent evidence, quotations, metrics, customers, or citations.
- Adapt the narrative to the audience, context, and requested outcome.

Do not impose a fixed slide sequence, bullet count, image count, or layout catalog.

## Visual direction

Read [references/visual-direction.md](references/visual-direction.md) while translating the approved direction into the theme and slide compositions.

Keep text, tables, charts, and simple shapes native and editable. Use raster images for photographs, generated artwork, textures, and complex visual scenes only.

Default typography guardrails:

- deck title: 50pt or larger
- slide title: 35pt or larger
- body: 18pt or larger where practical; never below 16pt
- source notes: readable at presentation scale

Prefer shortening, reflowing, changing layout, or splitting a slide before reducing font size.

## Image generation

Use `$imagegen` for original cover art, editorial illustration, atmospheric backgrounds, conceptual scenes, or other raster artwork with a defined communication role.

Before generation:

1. Define the asset's purpose and placement.
2. Match the approved visual direction, palette, mood, and composition.
3. Reserve negative space for overlaid text when required.
4. Choose an aspect ratio suitable for the target box.
5. Avoid readable text, logos, UI, charts, and precise diagrams inside generated imagery.

Inspect each selected generated image before using it. Reject identity drift, artifacts, accidental text, unsuitable cropping, weak subject placement, inconsistent style, or insufficient resolution.

Do not use image generation for editable charts, tables, typography, icons, simple diagrams, or decorative filler. If `$imagegen` is unavailable, continue with native shapes, typography, source assets, or an image-free composition unless the approved plan requires a specific original image.

## Rendering

Build into a temporary review directory first. Invoke the internal runtime with the approved DeckSpec, current workspace `out/`, and temporary review directory.

The renderer must produce:

- an editable PPTX through PptxGenJS
- 3840x2160 preview images
- a PDF assembled from the reviewed preview pages
- temporary deterministic QA reports

Use PptxGenJS as the canonical editable representation and the high-resolution preview as the canonical visual review surface.

## Deterministic and visual QA

Read [references/qa-rubric.md](references/qa-rubric.md) before accepting a build.

Run deterministic checks for:

- schema validity and plan approval
- missing or damaged images
- insufficient effective image resolution
- elements outside the canvas
- probable text overflow
- unintended element overlap
- unsafe image cropping
- invalid PPTX structure
- PPTX/PDF page count and order mismatch
- unexpected files in `out/`

Then inspect every preview at full size for:

- hierarchy and message clarity
- alignment, spacing, and balance
- text wrapping and density
- contrast and legibility
- crop safety and image quality
- visual consistency across slides
- narrative continuity and pacing
- source-note readability

Automated checks are necessary but not sufficient. A deck does not pass merely because the code reports no errors.

## Repair workflow

Repair the smallest failing scope:

1. Shorten or clarify content.
2. Reflow or resize the responsible element.
3. Change the local composition.
4. Split the slide when the content cannot remain legible.
5. Replace or recrop the responsible image.
6. Regenerate artwork only when the artwork itself is defective.

Rebuild and recheck after every repair pass. Perform no more than two automatic correction passes. After two unsuccessful passes, stop and report the exact blocker, affected slides, and the decision required from the user.

Do not regenerate the whole deck for one local defect. Do not hide overflow by shrinking text below the minimum size.

## Cleanup and delivery

Before delivery:

1. Confirm that both expected final files exist.
2. Confirm that PPTX and PDF have matching slide counts, order, and 16:9 proportions.
3. Confirm that native text, tables, charts, and simple shapes remain editable.
4. Confirm that `out/` contains only `.pptx` and `.pdf` files.
5. Remove temporary DeckSpec, extracts, generated assets, previews, QA reports, logs, and caches when safe.
6. Preserve the user's original sources unchanged.

If the build fails, clean temporary material when it is no longer useful, but retain the minimum diagnostic information needed to explain the blocker.

## Acceptance criteria

- The user explicitly approved the Deck Plan.
- The deck follows the approved objective, audience, language, length, and visual direction.
- Every slide has a clear purpose and readable hierarchy.
- Claims and assets preserve source provenance where possible.
- PPTX native content is editable.
- PDF visually matches the reviewed deck.
- Every preview has passed deterministic and visual review.
- No blocking overflow, bounds, image, overlap, crop, contrast, or consistency defect remains.
- Final output contains the expected PPTX and PDF for the deck slug and no non-deliverable artifacts.
- Intermediate artifacts have not leaked into `out/`.

## Final response

State that the deck was generated from the approved plan and visually checked. Return exactly one link to the final PPTX and one link to the final PDF. Do not expose DeckSpec, preview PNGs, QA JSON, generated-image paths, temporary paths, setup commands, or internal renderer commands.
