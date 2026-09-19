---
name: essay-ingest
description: |
  Review or improve an essay the user already wrote. Use when the user pastes, attaches, or points
  to an existing application essay, personal statement, statement of purpose, or scholarship essay
  and asks for a review, feedback, or revisions, or asks to make it (or one line, claim, or
  paragraph of it) stronger, more specific, more personal, less generic, or less like AI. Stores
  the text as given, grounds every claim in a real experience by asking, and proposes changes the
  user approves one at a time. Never invents details.
---

# essay-ingest

The plugin root is `${CLAUDE_PLUGIN_ROOT}` in Claude Code. In Codex and other runtimes it is two
directories above this file. Paths below are relative to that root.

1. Read `README.md` and `system/Ingest.md`. If the user gave only one line or paragraph, treat it as
   the essay text for now and ask for the rest later. Never strengthen a line by adding a detail,
   number, name, or scene the user did not give. Ask one question for the real story instead.
2. Follow `system/Ingest.md` exactly. Resolve the essay text. Read the file the user named, or ask
   the user to paste the essay if there is no file. Then collect the essay prompt, the essay type,
   the limit, and the target program. Ask **one question at a time** with the `ask_question()`
   protocol in `CONVENTIONS.md`.
3. Ask the one required provenance question: did the applicant write this text themselves, without
   AI help? Record the answer as `self_authored` in `Drafts.md`.
4. Create `artifacts/<essay_id>/` from `templates/`, store the essay text verbatim as
   `draft-ingested` in `Drafts.md`, and write `EssayState.md` with `mode: ingest`.
5. Do not rewrite the essay in this step. The review and the suggestions come from `essay-next`, one
   unit at a time. Never invent an experience the applicant did not give.

End by telling the user the essay_id and that `essay-next` starts the review. Say that each
suggestion waits for their yes, edit, or no before it is applied.
