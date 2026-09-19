# EssayOS, instructions for Codex (and any agent runtime)

This file is the entry point for Codex and other agent runtimes. Claude Code users get the same
behavior through the entry skills in `skills/`, which appear as slash commands. EssayOS is a portable Markdown+YAML package.
It has no build step, no dependencies, and no network calls.

## What this is

An idempotent, stateful operating system for writing application essays. It **elicits, arranges,
and verifies the applicant's real experiences**. It never fabricates an essay. Read `README.md`
first.

## How to operate it

1. **Read** `README.md`, then `CONVENTIONS.md` (the universal contract every skill obeys).
2. **Initialize**: follow `system/Init.md` to create `artifacts/<essay_id>/` from `templates/`. If
   the applicant already has an essay, follow `system/Ingest.md` instead. It stores the essay as
   given and sets `mode: ingest`.
3. **Loop**: read `kernel/Orchestrator.md`. Determine the next skill from `EssayState.md`. Read
   that skill file. Execute its seven-step loop for ONE unit of work. Repeat until
   `verification/FinalReviewer.md` returns `READY_FOR_SUBMISSION: YES`.
4. **Resume** anytime by reconstructing state from `artifacts/<essay_id>/` (see `system/Resume.md`).

The entry skills in `skills/` wrap these steps in every runtime: `essayos`, `essay-init`,
`essay-ingest`, `essay-scan`, `essay-next`, `essay-status`, `essay-resume`, and `essay-lint`. The plugin
follows the portable Agent Plugins layout: `plugin.json` at the root and a `.codex-plugin/plugin.json`
overlay.

## Hard rules (do not violate)

- Ask the applicant **one question at a time** (`ask_question()` in `CONVENTIONS.md`).
- Word every question in plain English (CONVENTIONS §5a). No system jargon reaches the applicant.
- **Never generate a full essay in one pass.** Write one section at a time.
- **Never fabricate.** Every claim must trace to a real experience (`meta/ClaimEvidenceMapper.md`).
- Revision is **monotonic** (best-draft ratchet): accept-only, ε-improvement, ceiling gate.
- In ingest mode, apply a change only after the applicant said accept or edit. Never touch the
  original ingested text.
- Themes require **≥2** supporting experiences. No adjective-themes.
- The final prose must sound **human, not scientific**, and not like a model. Before you store any
  prose, run the `humanizer` skill (`skills/humanizer/SKILL.md`) in embedded mode with the
  `VoiceModel` quotes as the writing sample. Science shapes the process only.

## Third-party skills

Two pinned skills live in `skills/` and are part of the contract (CONVENTIONS §10):

- `humanizer` 3.0.0: the AI-tell catalog and the final pass over every span of essay prose.
- `simple-english` 2.1.0: the wording rules for questions, reports, and this package's docs. Never
  apply it to the essay prose.

## Testing the package

Run `node bin/essayos.mjs lint` (Node ≥ 18, stdlib only) to self-check the package for contract
drift. `node bin/essayos.mjs state <essay_id>` inspects a live essay. The OS is fully usable without
Node. The inspector is a convenience.
