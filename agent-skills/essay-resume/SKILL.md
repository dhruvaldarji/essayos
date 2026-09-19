---
name: essay-resume
description: |
  Resume an interrupted EssayOS essay from the files on disk. Use when the user comes back to an
  essay after a break, a crash, or a new session, or when the state may have been edited by hand.
---

# essay-resume

The plugin root is two directories above this file. Paths below are relative to that root.

1. Read `system/Resume.md`.
2. Reconstruct the state from `artifacts/<essay_id>/` alone. Do not rely on any prior conversation.
   Recompute the artifact statuses and the staleness from the files on disk.
3. Hand off to the Orchestrator (`kernel/Orchestrator.md`) to pick the next skill.
4. Report where the essay stands and what runs next, then stop.
