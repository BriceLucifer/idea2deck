# Idea to Deck

A self-contained Codex Skill for turning text, Markdown, images, PDFs, DOCX files, and existing presentations into editable 16:9 PowerPoint decks and matching high-quality PDFs.

The Skill plans the story with the user, waits for explicit Deck Plan approval, optionally uses subagents and image generation, renders native PowerPoint content with PptxGenJS, and performs deterministic plus visual QA.

## Install for Codex

Install globally for Codex directly from GitHub:

```bash
npx skills add BriceLucifer/idea2deck --skill idea-to-deck --agent codex --global --copy --yes
```

The same command expanded for readability:

```bash
npx skills add BriceLucifer/idea2deck \
  --skill idea-to-deck \
  --agent codex \
  --global \
  --copy \
  --yes
```

Start a new Codex task after installation, then invoke the Skill explicitly or describe a deck request naturally:

```text
$idea-to-deck Turn these source materials into an investor presentation.
```

The first build may ask permission to install the bundled Node.js dependencies. This is a one-time setup for the local PptxGenJS runtime.

## Installation scope and locations

The command above includes `--global`, so the Skill is installed for the current user and is available from every Codex workspace.

```text
${CODEX_HOME}/skills/idea-to-deck/
```

When `CODEX_HOME` is not set, Codex uses:

```text
~/.codex/skills/idea-to-deck/
```

The installed folder contains the complete Skill and its runtime:

```text
~/.codex/skills/idea-to-deck/
├── SKILL.md
├── agents/
├── references/
├── scripts/
├── src/
├── package.json
├── package-lock.json
└── node_modules/       # created by the one-time runtime setup
```

To install the Skill only for the current project, omit `--global`:

```bash
npx skills add BriceLucifer/idea2deck \
  --skill idea-to-deck \
  --agent codex \
  --copy \
  --yes
```

This installs it at:

```text
<current-project>/.agents/skills/idea-to-deck/
```

Choose the installation scope according to how the Skill will be used:

| Scope | Location | Recommended use |
| --- | --- | --- |
| Global | `~/.codex/skills/idea-to-deck/` | Personal installation across all projects |
| Project | `./.agents/skills/idea-to-deck/` | Repository-specific or team-shared installation |

Use `--copy` so `SKILL.md`, references, runtime code, setup script, and lockfile are installed together. Do not distribute or copy a local `node_modules` directory; the setup script installs platform-appropriate dependencies on the user's machine.

## Runtime and output locations

The installed Skill directory contains code and dependencies, not user deliverables. Generated files are written to the active Codex workspace:

```text
<current-workspace>/out/
├── <deck-slug>.pptx
└── <deck-slug>.pdf
```

Intermediate DeckSpec files, source extracts, generated images, previews, QA reports, logs, and caches stay in a system temporary directory and are cleaned after a successful run. They are never written to `out/`.

In summary:

```text
~/.codex/skills/idea-to-deck/  -> Skill instructions and runtime
<current-workspace>/out/       -> final PPTX and PDF
<system temporary directory>/  -> DeckSpec, assets, previews, and QA
```

After installing or updating the Skill, start a new Codex task so the new Skill definition is discovered cleanly.

## Local development

The canonical Skill lives under `skills/idea-to-deck`. The `.agents/skills/idea-to-deck` link exposes the same folder to Codex while working in this repository.

```bash
npm --prefix skills/idea-to-deck ci
npm --prefix skills/idea-to-deck test
npm --prefix skills/idea-to-deck run test:integration
```

Runtime code stays inside the Skill's `src/` directory. User-facing deck files are written to the active workspace's `out/` directory. DeckSpec, generated images, previews, and QA reports remain temporary.
