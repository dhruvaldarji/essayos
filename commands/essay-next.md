---
description: Advance an EssayOS essay one step. Use when the user asks what is next, wants the next interview question, the next drafted section, or the next review suggestion for an essay that EssayOS already tracks.
argument-hint: [essay-id]
---

Drive the essay forward one verified step.

1. Read `${CLAUDE_PLUGIN_ROOT}/kernel/Orchestrator.md`.
2. Read `${CLAUDE_PLUGIN_ROOT}/artifacts/$ARGUMENTS/EssayState.md`. If the essay_id is absent, ask
   for it.
3. Run the Orchestrator loop. Find the highest-value gap (stale before new). Select the next skill
   for the essay's `mode` (`compose` or `ingest`). Read that skill file from
   `${CLAUDE_PLUGIN_ROOT}/`. Execute its seven-step loop for ONE unit of work. A unit is one
   question, one section, or one suggestion.
4. Honor the convergence ratchet. Score against the best draft, accept only improvements, require an
   ε-improvement, and respect the ceiling gate. Never enter the revise loop with
   `quality_threshold > quality_ceiling`.
5. Run the skill's assertions with `kernel/AssertionEngine.md`. A failure blocks the state update.
6. Update the artifacts (upsert by id, recompute hashes, set `next_skill`).

Stop after one unit and report what ran, which assertions passed, the quality against the threshold
and ceiling, and the next skill. Re-run this command to keep advancing. If `FinalReviewer` returns
`READY_FOR_SUBMISSION: YES`, say so.
