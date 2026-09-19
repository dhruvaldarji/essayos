---
name: essay-next
description: |
  Advance an EssayOS essay by one verified step. Use when the user asks what is next, wants to
  continue the interview, wants the next section drafted, or wants the next review suggestion for an
  ingested essay.
---

# essay-next

The plugin root is `${CLAUDE_PLUGIN_ROOT}` in Claude Code. In Codex and other runtimes it is two
directories above this file. Paths below are relative to that root.

1. Read `kernel/Orchestrator.md`.
2. Read `artifacts/<essay_id>/EssayState.md`. If you do not know the essay_id, ask for it.
3. Run the Orchestrator loop. Find the highest-value gap (stale before new). Select the next skill for
   the essay's `mode` (`compose` or `ingest`). Read that skill file. Execute its seven-step loop for
   ONE unit of work. A unit is one question, one section, or one suggestion.
4. Honor the convergence ratchet. Score against the best draft. Accept only improvements of at least
   ε. Never enter the revise loop when `quality_threshold > quality_ceiling`.
5. Run the skill's assertions with `kernel/AssertionEngine.md`. A failure blocks the state update.
6. Update the artifacts. Upsert by id, recompute the hashes, and set `next_skill`.

Stop after one unit. Report what ran, which assertions passed, the quality against the threshold and
the ceiling, and the next skill. If `FinalReviewer` returns `READY_FOR_SUBMISSION: YES`, say so.
