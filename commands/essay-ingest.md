---
description: Review an essay the user already wrote. Use when the user pastes, attaches, or points to an existing application essay, personal statement, statement of purpose, or scholarship essay and asks for a review, feedback, revisions, or help making it sound like them, less generic, or less like AI. Stores the essay as given and proposes changes the user approves one at a time.
argument-hint: [essay-id] [path-to-essay-file]
---

Ingest an existing essay into EssayOS and start the review.

1. Read `${CLAUDE_PLUGIN_ROOT}/README.md` and `${CLAUDE_PLUGIN_ROOT}/system/Ingest.md`.
2. Follow `system/Ingest.md` exactly. Resolve the essay text: read the file at the given path, or
   ask the user to paste the essay if no path is given. Then collect the essay prompt, the essay
   type, the limit, and the target program. Ask **one question at a time** with the
   `ask_question()` protocol in `${CLAUDE_PLUGIN_ROOT}/skills/CONVENTIONS.md`.
3. Ask the one required provenance question: did the applicant write this text themselves, without
   AI help? Record the answer as `self_authored` in `Drafts.md`.
4. Create `${CLAUDE_PLUGIN_ROOT}/artifacts/<essay_id>/` from `${CLAUDE_PLUGIN_ROOT}/templates/`,
   store the essay text verbatim as `draft-ingested` in `Drafts.md`, and write `EssayState.md` with
   `mode: ingest`.
5. Never rewrite the essay in this command. The review and the suggestions come from
   `/essayos:essay-next`, one unit at a time. Never invent an experience the applicant did not give.

Argument: $ARGUMENTS

End by telling the user the essay_id and to run `/essayos:essay-next`. Say that each suggestion
will wait for their yes, edit, or no before it is applied.
