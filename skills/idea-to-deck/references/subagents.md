# Optional Subagents

Read this reference only when the user enables subagents during kickoff.

Use no more than three bounded, non-overlapping lanes:

- **Source analyst:** extract facts, evidence, themes, contradictions, and provenance from heterogeneous inputs.
- **Narrative critic:** challenge argument order, audience fit, density, missing evidence, and redundancy.
- **Visual QA reviewer:** inspect final previews against the approved visual direction after rendering.

## Delegation rules

- Keep delegated tasks read-only.
- Give each subagent raw task-local sources and minimum necessary context.
- Do not present the main agent's conclusions as ground truth.
- Do not let subagents edit DeckSpec, write to `out/`, run competing final renderers, or independently deliver files.
- Do not delegate user interaction, approval tracking, final reconciliation, cleanup, or delivery.
- Use the visual QA reviewer only after preview images exist.

The main agent must reconcile all findings and remains responsible for the approved narrative, source decisions, DeckSpec, image generation choices, rendering, repair, and final output.

If the user declines subagents or they are unavailable, use the same workflow in single-agent mode. Do not reduce the quality gates.
