---
description: Initialize a new EssayOS essay workspace (college admissions, scholarship, statement of purpose, cover letter, and more)
argument-hint: [essay-id or essay type]
---

Initialize a new essay in EssayOS.

1. Read `${CLAUDE_PLUGIN_ROOT}/README.md` and `${CLAUDE_PLUGIN_ROOT}/system/Init.md`.
2. Follow `system/Init.md` exactly: collect the essay prompt, essay type, word/char limit, and target
   program, asking **one question at a time** per `${CLAUDE_PLUGIN_ROOT}/skills/CONVENTIONS.md`
   `ask_question()` protocol. Do not batch questions.
3. Create `${CLAUDE_PLUGIN_ROOT}/artifacts/<essay_id>/` from `${CLAUDE_PLUGIN_ROOT}/templates/` and
   write the first `EssayState.md`.
4. If the essay id already exists, do NOT overwrite, report status and stop.

Argument: $ARGUMENTS

End by telling the user the essay_id and to run `/essayos:essay-next`.
