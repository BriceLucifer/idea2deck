# Runtime and Storage

Read this reference only after Deck Plan approval, before the first build, or when runtime setup fails.

## Locations

Resolve `SKILL_DIR` as the directory containing `SKILL.md`.

```text
Runtime entry:  <SKILL_DIR>/src/run.mjs
Spec preflight: <SKILL_DIR>/src/validate.mjs
Runtime setup:  <SKILL_DIR>/scripts/setup.mjs
Schema:         <SKILL_DIR>/src/schema/deck-spec.mjs
Final output:   <current-workspace>/out
Intermediates:  <system-temp>/idea-to-deck-<task-id>/
```

Never write user deliverables into the installed Skill directory. Treat the runner as an internal implementation detail, not a user-facing CLI.

## Readiness check

Require Node.js 20 or newer. Check dependencies with:

```bash
node "$SKILL_DIR/scripts/setup.mjs" --check
```

If dependencies are missing, explain that the local PptxGenJS runtime requires a one-time installation and ask permission before running:

```bash
node "$SKILL_DIR/scripts/setup.mjs" --install
```

Do not install dependencies merely to prepare the kickoff or Deck Plan. Do not commit or distribute `node_modules`; install platform-appropriate dependencies on the user's machine.

## Deterministic preflight

Before every render, and again after each DeckSpec repair, run the bundled validator:

```bash
node "$SKILL_DIR/src/validate.mjs" --spec "$DECK_SPEC"
```

Use this entry point instead of composing ad hoc imports or guessing schema export names. A nonzero exit blocks rendering.

## Build workspace

Create a dedicated system temporary directory for DeckSpec, source extracts, generated images, preview pages, QA reports, and temporary PPTX/PDF files. Copy only the verified final PPTX and PDF into the active workspace's `out/` directory.

Remove temporary artifacts after successful verification, then explicitly verify that the task directory no longer exists before reporting cleanup. On failure, retain only the minimum diagnostic material needed to explain or repair the blocker.
