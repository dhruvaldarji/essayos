# EssayOS, instructions for Codex (and any agent runtime)

This file is the entry point for Codex and other agent runtimes. (Claude Code users get the same
behavior through the plugin commands in `commands/`.) EssayOS is a portable Markdown+YAML package,
no build step, no dependencies, no network.

## What this is

An idempotent, stateful operating system for writing application essays. It **elicits, arranges, and
verifies the applicant's real experiences**, it never fabricates an essay. Read `README.md` first.

## How to operate it

1. **Read** `README.md`, then `skills/CONVENTIONS.md` (the universal contract every skill obeys).
2. **Initialize**: follow `system/Init.md` to create `artifacts/<essay_id>/` from `templates/`.
3. **Loop**: read `kernel/Orchestrator.md`, determine the next skill from `EssayState.md`, read that
   skill file, and execute its OBSERVE→ANALYZE→PLAN→EXECUTE→VERIFY→LEARN→UPDATE loop for ONE unit of
   work. Repeat until `verification/FinalReviewer.md` returns `READY_FOR_SUBMISSION: YES`.
4. **Resume** anytime by reconstructing state from `artifacts/<essay_id>/` (see `system/Resume.md`).

## Hard rules (do not violate)

- Ask the applicant **one question at a time** (`ask_question()` in `skills/CONVENTIONS.md`).
- **Never generate a full essay in one pass.** Write one section at a time.
- **Never fabricate.** Every claim must trace to a real experience (`meta/ClaimEvidenceMapper.md`).
- Revision is **monotonic** (best-draft ratchet): accept-only, ε-improvement, ceiling gate.
- Themes require **≥2** supporting experiences. No adjective-themes.
- The final prose must sound **human, not scientific**. Science shapes the process only.

## Testing the package

Run `node bin/essayos.mjs lint` (Node ≥ 18, stdlib only) to self-check the package for contract
drift. `node bin/essayos.mjs state <essay_id>` inspects a live essay. The OS is fully usable without
Node; the inspector is a convenience.
