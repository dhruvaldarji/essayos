---
description: Advance an EssayOS essay one step, the Orchestrator picks and runs the next skill.
argument-hint: [essay-id]
---

Drive the essay forward one verified step.

1. Read `${CLAUDE_PLUGIN_ROOT}/kernel/Orchestrator.md`.
2. Read `${CLAUDE_PLUGIN_ROOT}/artifacts/$ARGUMENTS/EssayState.md` (or ask for the essay_id if absent).
3. Run the Orchestrator loop: find the highest-value gap (stale before new), select the next skill,
   then read that skill file from `${CLAUDE_PLUGIN_ROOT}/` and execute its OAPEVL+U loop for ONE unit
   of work (one question, or one section).
4. Honor the convergence ratchet: score against the best draft, accept-only, ε-improvement, ceiling
   gate. Never enter the revise loop with `quality_threshold > quality_ceiling`.
5. Run the skill's assertions via `kernel/AssertionEngine.md`; a failure blocks the state update.
6. Update artifacts (upsert by id, recompute hashes, set `next_skill`).

Stop after one unit and report: what ran, assertions passed, quality vs threshold/ceiling, next skill.
Re-run this command to keep advancing. If `FinalReviewer` returns READY_FOR_SUBMISSION: YES, say so.
