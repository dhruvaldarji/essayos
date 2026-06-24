---
description: Resume an interrupted EssayOS essay, reconstruct state from disk and continue.
argument-hint: [essay-id]
---

Resume work on an existing essay. This proves the restartable-from-disk invariant.

1. Read `${CLAUDE_PLUGIN_ROOT}/system/Resume.md`.
2. Reconstruct state from `${CLAUDE_PLUGIN_ROOT}/artifacts/$ARGUMENTS/` alone, do not rely on any
   prior conversation. Recompute artifact statuses and staleness from the files on disk.
3. Hand off to the Orchestrator (`kernel/Orchestrator.md`) to pick the next skill.
4. Report where the essay stands and what runs next, then stop.
