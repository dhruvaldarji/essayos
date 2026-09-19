---
description: Resume an EssayOS essay from the files on disk. Use when the user comes back to an essay after a break, a crash, or a new session, or when the state may have been edited by hand.
argument-hint: [essay-id]
---

Resume work on an existing essay. This proves the restartable-from-disk invariant.

1. Read `${CLAUDE_PLUGIN_ROOT}/system/Resume.md`.
2. Reconstruct the state from `${CLAUDE_PLUGIN_ROOT}/artifacts/$ARGUMENTS/` alone. Do not rely on
   any prior conversation. Recompute the artifact statuses and the staleness from the files on disk.
3. Hand off to the Orchestrator (`kernel/Orchestrator.md`) to pick the next skill.
4. Report where the essay stands and what runs next, then stop.
