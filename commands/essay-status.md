---
description: Show where an EssayOS essay stands. Use when the user asks for the status, the phase, the score, or where they left off on an essay. Read-only; reports not-found if there is no workspace.
argument-hint: [essay-id]
---

Report the essay status (read-only).

1. Read `${CLAUDE_PLUGIN_ROOT}/system/Status.md`.
2. Read `${CLAUDE_PLUGIN_ROOT}/artifacts/$ARGUMENTS/EssayState.md` and the artifact registry.
3. Report the phase and the mode. Report each artifact's status (missing, thin, stale, or ok).
   Report the overall quality against the threshold and the ceiling. Report the recommended next
   skill. In ingest mode, also report the count of open suggestions.
4. If Node is available, you can run `node ${CLAUDE_PLUGIN_ROOT}/bin/essayos.mjs state $ARGUMENTS`
   for a deterministic read-out. The OS works without it.

Do not modify anything.
