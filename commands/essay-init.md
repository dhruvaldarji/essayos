---
description: Start a new application essay from scratch with EssayOS. Use when the user wants to begin a college admissions essay, scholarship essay, statement of purpose, personal statement, residency or fellowship statement, or cover letter and has no draft yet.
argument-hint: [essay-id or essay type]
---

Initialize a new essay in EssayOS.

1. Read `${CLAUDE_PLUGIN_ROOT}/README.md` and `${CLAUDE_PLUGIN_ROOT}/system/Init.md`.
2. Follow `system/Init.md` exactly. Collect the essay prompt, the essay type, the word or character
   limit, and the target program. Ask **one question at a time** with the `ask_question()` protocol in
   `${CLAUDE_PLUGIN_ROOT}/skills/CONVENTIONS.md`. Do not batch questions.
3. Create `${CLAUDE_PLUGIN_ROOT}/artifacts/<essay_id>/` from `${CLAUDE_PLUGIN_ROOT}/templates/` and
   write the first `EssayState.md` with `mode: compose`.
4. If the essay id already exists, do NOT overwrite. Report the status and stop.

Argument: $ARGUMENTS

End by telling the user the essay_id and to run `/essayos:essay-next`.
