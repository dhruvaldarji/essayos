---
skill: Ingest
category: system
purpose: Bring an essay the applicant already wrote into EssayOS — store it verbatim, record who wrote it, seed the workspace in mode ingest, and hand off to the review pipeline without rewriting a word.
reads: [EssayState, Drafts, Requirements]
writes: [EssayState, Drafts, Requirements, IngestReport]
preconditions: [essay_id is known or derivable, the essay text is available as a file path or pasted text]
postconditions: [artifacts/<essay_id>/ exists, EssayState.mode is ingest, Drafts holds draft-ingested verbatim with ingested_hash set, Drafts.self_authored is recorded, Requirements is populated, IngestReport is seeded]
idempotency_key: artifacts/<essay_id>/EssayState.md already exists -> no-op (never overwrite; never re-ingest)
asks_questions: true
---

# Ingest (system)

The front door for an essay that already exists. Where `system/Init` starts from nothing, Ingest
starts from a draft the applicant brings in, whether they wrote it by hand, with a friend, or with a
model. Its whole job is to store that text **exactly as given**, learn the four facts the pipeline
needs (prompt, type, limit, program), learn one more fact that decides how the voice is modeled
(did they write it themselves?), and then get out of the way. It never rewrites, never scores, never
comments on the essay. Those are downstream skills' jobs, one unit at a time, with the applicant
deciding each change.

## When to run

Once, when the applicant has an existing essay and wants it reviewed and revised in their own
voice. Safe to run repeatedly: on an already-initialized essay it does nothing. Use `system/Init`
instead when there is no essay yet.

## The Loop

**OBSERVE** — Resolve `essay_id`. Check whether `artifacts/<essay_id>/EssayState.md` exists. Resolve
the essay text: read the file at the path the caller gave, or take the pasted text. Read whatever
inputs the caller already supplied (prompt, essay_type, word/char limit, program, self_authored).

**ANALYZE** — If `EssayState.md` exists, this is a no-op: stop and report "already initialized" (this
also covers "already ingested"). Otherwise determine which required fields are still missing: the
essay text, `prompt`, `essay_type`, `word_limit` (or `char_limit`), `program`, and `self_authored`.

**PLAN** — The smallest unit is "collect one missing field" or, once all are known, "create the
workspace and store the draft." Collect in this order: essay text → prompt → essay_type →
word/char limit → program → self_authored.

**EXECUTE** —
- If a field is missing, call `ask_question()` for exactly ONE field (CONVENTIONS §5), worded to the
  plain-English rules in CONVENTIONS §5a. `program` may be "generic / none" → null. The
  `self_authored` question must be asked plainly and without judgment, for example: "Did you write
  this text yourself, without an AI tool? A yes or no is enough." The answer changes how the voice
  is modeled, not whether the essay is welcome.
- Once everything is known, create `artifacts/<essay_id>/` and copy every file from `templates/`
  verbatim.
- Write `EssayState.md` with `mode: ingest`, the four required fields, `phase: init`, and the full
  registry at `missing`.
- Write `Requirements.md` from the prompt, type, limits, and program.
- Write `Drafts.md`: `origin: ingested`, `self_authored`, and one draft `draft-ingested`
  (`origin: ingested`, `complete: true`, `score: null`) whose `full_text` is the essay **byte for
  byte** (whitespace normalized to LF only). Split it into paragraphs as provisional sections
  `sec-1..N` with per-section hashes; `architecture/ReverseOutline` may re-cut them later, but the
  `full_text` and `ingested_hash` never change. Set `ingested_hash` to the hash of `full_text`.
- Seed `IngestReport.md` from its template with `ingested_draft_id: draft-ingested` and
  `self_authored`.

**VERIFY** — Assert `workspace_exists()`, `state_parses()`, `registry_complete()`, and
`ingest_preserved()` (the stored `full_text` hashes to `ingested_hash`). A failed assertion blocks
UPDATE.

**LEARN** — Append an Ingest entry to `RevisionHistory` (Issue: essay brought in / Fix: stored
verbatim as draft-ingested / Outcome: initialized in mode ingest, self_authored recorded).

**UPDATE** — Set `EssayState.phase: init`, `next_skill: Orchestrator`, bump `updated`. Hand control
back to the Orchestrator, which runs the ingest pipeline.

## Assertions

- `assert workspace_exists()` — `artifacts/<essay_id>/` and `EssayState.md` are present.
- `assert state_parses()` — front matter is valid with all required keys, including `mode: ingest`.
- `assert registry_complete()` — every template artifact appears in the registry at `missing`
  (except the ones this skill just wrote).
- `assert ingest_preserved()` — `draft-ingested.full_text` hashes to `Drafts.ingested_hash`.

## Idempotency

`idempotency_key` is the existence of `artifacts/<essay_id>/EssayState.md`. If it exists, Ingest makes
**zero** changes and reports "already initialized." Ingesting the same text into a new `essay_id`
creates a second, independent workspace; it never merges. The stored text is a pure function of the
input: the same essay ingested twice into two fresh ids yields the same `ingested_hash`.

## Output

```
INGEST: <essay_id>
STORED: draft-ingested (<n> words, <k> provisional sections, hash <ingested_hash>)  |  ALREADY INITIALIZED (no change)
PROMPT: "<verbatim>"  TYPE: <essay_type>  LIMIT: <word/char>  PROGRAM: <program|generic>
SELF-AUTHORED: <yes|no>
NEXT: Orchestrator — ingest pipeline (reverse outline first)
```

## Gotchas

- **Store it exactly. Never "clean it up" on the way in.** A fixed typo at ingest is an edit the
  applicant did not approve, and it breaks `ingest_preserved()`. The original must stay recoverable
  forever.
- **Do not review here.** No verdicts, no "this sounds like AI," no suggestions. The applicant gets
  one finding at a time from the review skills, with a decision attached to each.
- **`self_authored: false` is not a problem to fix; it is a fact to route on.** When the text was not
  written by the applicant, `VoiceModel` must not treat it as a voice sample. The voice comes from
  the interview instead.
- **One question at a time, including the provenance question.** Six fields means up to six turns.
  Never present a form.
- **The ingested text is evidence of *nothing*.** Every claim in it is untraceable until the applicant
  confirms the experience behind it in `GrillMe`. Ingest does not write to `ExperienceDatabase`.
