# Idea to Deck

`idea-to-deck` is a Codex Skill that turns text, Markdown, images, PDFs, DOCX files, and existing presentations into editable 16:9 PowerPoint decks and coordinated high-quality PDFs.

The Skill first understands the objective, audience, language, source material, and visual direction. For a complete request, it presents one combined Brief + Deck Plan and waits for explicit approval before building. When essential information is missing, it asks no more than three focused questions first. Optional subagent lanes and image generation can be enabled in the same approval.

## Requirements

- Codex
- Node.js 20 or newer
- `npx` and network access during installation

The generated PowerPoint uses native PptxGenJS text, tables, charts, shapes, and connectors wherever practical, so the core content remains editable.

## Project installation

Choose project installation when the Skill should be available only inside one repository or when a team wants to keep the same Skill version with the project.

Run the command from the project root:

```bash
npx skills add BriceLucifer/idea2deck \
  --skill idea-to-deck \
  --agent codex \
  --copy \
  --yes
```

It installs the Skill here:

```text
<current-project>/.agents/skills/idea-to-deck/
```

Project installation means:

- The Skill is discovered for Codex tasks opened in that project.
- The installed copy can be committed when the team wants to share and pin it.
- Runtime dependencies stay under the installed Skill directory, not in the project's root `node_modules`.
- Generated decks are written to `<current-project>/out/`.

Start a new Codex task after installation so Codex discovers the Skill cleanly.

## Global installation

Choose global installation for a personal setup that should work across all Codex workspaces on the current machine.

```bash
npx skills add BriceLucifer/idea2deck \
  --skill idea-to-deck \
  --agent codex \
  --global \
  --copy \
  --yes
```

It installs the Skill for the current user at:

```text
${CODEX_HOME}/skills/idea-to-deck/
```

When `CODEX_HOME` is not set, the default location is:

```text
~/.codex/skills/idea-to-deck/
```

Global installation means:

- The Skill is available from every Codex workspace for the current user.
- The installation is personal and is not automatically shared with a project or team.
- Runtime dependencies stay inside the global Skill directory.
- Generated decks still go to the active workspace's `out/` directory, never to `~/.codex/skills/`.

Start a new Codex task after installation so Codex discovers the Skill cleanly.

## Which installation should I use?

Use project installation for repository-specific or team-shared workflows. Use global installation when you want one personal installation available everywhere. Installing both is normally unnecessary; prefer the project copy when a repository deliberately carries one.

`--copy` is important in both commands. It installs `SKILL.md` together with its references, scripts, source code, package manifest, and lockfile. Do not distribute `node_modules`; the Skill installs platform-appropriate dependencies on the user's machine.

## First use

The first build may ask for permission to install the bundled Node.js dependencies. This one-time setup creates `node_modules` inside the installed Skill directory. It does not modify the active project's package manifest.

You can invoke the Skill explicitly:

```text
$idea-to-deck Turn these source materials into an investor presentation.
```

You can also describe the request naturally. Codex will use the Skill when the request is clearly about creating, redesigning, or rebuilding a presentation.

The normal interaction is:

1. Provide an idea or attach source files.
2. Review the Brief + Deck Plan.
3. Reply `approve and build`, optionally enabling image generation or named subagent lanes.
4. Receive the final PPTX and PDF in the workspace `out/` directory.

## Files and output locations

The installed Skill contains instructions and runtime code:

```text
<skill-directory>/
├── SKILL.md
├── agents/
├── references/
├── scripts/
├── src/
├── package.json
├── package-lock.json
└── node_modules/       # created by the one-time runtime setup
```

Only final deliverables are published to the active workspace:

```text
<active-workspace>/out/
├── <deck-slug>.pptx
└── <deck-slug>.pdf
```

DeckSpec files, extracted sources, generated images, preview PNGs, QA reports, logs, and caches use a system temporary directory. A successful build cleans that directory. Each build publishes only its own PPTX/PDF pair and leaves unrelated files in `out/` untouched.

## Updating or uninstalling

To update, run the installation command for the same scope again. If the installer reports that the destination already exists, remove only the installed `idea-to-deck` directory for that scope and rerun the command. Start a new Codex task afterward.

To uninstall a project copy, remove:

```text
<project>/.agents/skills/idea-to-deck/
```

To uninstall a global copy, remove:

```text
${CODEX_HOME}/skills/idea-to-deck/
```

When `CODEX_HOME` is not set, remove:

```text
~/.codex/skills/idea-to-deck/
```

Removing the Skill does not remove decks already generated in workspace `out/` directories.

## Repository development

The canonical Skill source in this repository lives under `skills/idea-to-deck`. The local `.agents/skills/idea-to-deck` symlink exposes the same folder to Codex without duplicating it.

```bash
npm --prefix skills/idea-to-deck ci
npm --prefix skills/idea-to-deck test
npm --prefix skills/idea-to-deck run test:integration
```

Runtime code and tests stay inside the Skill. User-facing deck files belong in the repository-level `out/` directory; all other build artifacts remain temporary.
