---
name: essay-init
description: |
  Start a new EssayOS essay workspace. Use when the user wants to begin a new application essay,
  personal statement, statement of purpose, scholarship essay, or cover letter from scratch.
---

# essay-init

The plugin root is two directories above this file. Paths below are relative to that root.

1. Read `README.md` and `system/Init.md`.
2. Follow `system/Init.md` exactly. Collect the essay prompt, the essay type, the word or character
   limit, and the target program. Ask **one question at a time** with the `ask_question()` protocol
   in `skills/CONVENTIONS.md`. Do not batch questions.
3. Create `artifacts/<essay_id>/` from `templates/` and write the first `EssayState.md` with
   `mode: compose`.
4. If the essay id already exists, do NOT overwrite. Report the status and stop.

End by telling the user the essay_id and that `essay-next` moves the essay forward one step.
