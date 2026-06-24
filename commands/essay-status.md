---
description: Show the current state of an EssayOS essay, phase, artifacts, quality, next step.
argument-hint: [essay-id]
---

Report essay status (read-only).

1. Read `${CLAUDE_PLUGIN_ROOT}/system/Status.md`.
2. Read `${CLAUDE_PLUGIN_ROOT}/artifacts/$ARGUMENTS/EssayState.md` and the artifact registry.
3. Report: phase; each artifact's status (missing / thin / stale / ok); quality overall vs threshold
   vs ceiling; and the recommended next skill.
4. Optionally run `node ${CLAUDE_PLUGIN_ROOT}/bin/essayos.mjs state $ARGUMENTS` for a deterministic
   read-out if Node is available (the OS works without it).

Do not modify anything.
