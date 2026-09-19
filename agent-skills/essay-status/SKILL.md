---
name: essay-status
description: |
  Show where an EssayOS essay stands. Use when the user asks for the status, the phase, the quality
  score, or the next step of an essay. Read-only.
---

# essay-status

The plugin root is two directories above this file. Paths below are relative to that root.

1. Read `system/Status.md`.
2. Read `artifacts/<essay_id>/EssayState.md` and the artifact registry.
3. Report the phase and the mode. Report each artifact's status (missing, thin, stale, or ok). Report
   the overall quality against the threshold and the ceiling. Report the recommended next skill. In
   ingest mode, also report the count of open suggestions.
4. If Node is available, you can run `node bin/essayos.mjs state <essay_id>` for a deterministic
   read-out. The OS works without it.

Do not modify anything.
