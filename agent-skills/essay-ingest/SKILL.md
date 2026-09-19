---
name: essay-ingest
description: |
  Review an essay the user already wrote. Use when the user pastes or points to an existing
  application essay, personal statement, or statement of purpose and wants feedback, revisions, or
  help making it sound like them and not like AI. Stores the essay, finds AI-sounding and generic
  passages, grounds each claim in a real experience, and proposes revisions the user approves one at
  a time.
---

# essay-ingest

The plugin root is two directories above this file. Paths below are relative to that root.

1. Read `README.md` and `system/Ingest.md`.
2. Follow `system/Ingest.md` exactly. Resolve the essay text. Read the file the user named, or ask
   the user to paste the essay if there is no file. Then collect the essay prompt, the essay type,
   the limit, and the target program. Ask **one question at a time** with the `ask_question()`
   protocol in `skills/CONVENTIONS.md`.
3. Ask the one required provenance question: did the applicant write this text themselves, without
   AI help? Record the answer as `self_authored` in `Drafts.md`.
4. Create `artifacts/<essay_id>/` from `templates/`, store the essay text verbatim as
   `draft-ingested` in `Drafts.md`, and write `EssayState.md` with `mode: ingest`.
5. Do not rewrite the essay in this step. The review and the suggestions come from `essay-next`, one
   unit at a time. Never invent an experience the applicant did not give.

End by telling the user the essay_id and that `essay-next` starts the review. Say that each
suggestion waits for their yes, edit, or no before it is applied.
