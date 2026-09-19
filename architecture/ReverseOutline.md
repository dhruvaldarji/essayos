---
skill: ReverseOutline
category: architecture
purpose: Derive the Outline, SectionSpecifications, and an inferred MessageMap from an ingested draft so every downstream skill has stable section ids to work on — without changing a word of the draft.
reads: [EssayState, Drafts, Requirements]
writes: [Outline, SectionSpecifications, MessageMap]
preconditions: [EssayState.mode is ingest, Drafts has draft-ingested, Requirements exists]
postconditions: [Outline has one sec-N row per passage of draft-ingested in order, SectionSpecifications has one spec per section with the claims the passage actually makes, MessageMap holds the core message the draft states or implies with inferred true]
idempotency_key: upsert Outline/SectionSpecifications/MessageMap by section id; no-op when source_hashes match Drafts + Requirements
asks_questions: false
---

# ReverseOutline (architecture)

In compose mode the outline comes before the prose. In ingest mode the prose already exists, so the
outline is read *out of* it. ReverseOutline cuts the ingested draft into sections, names what each
one is doing, lists the claims each one makes, and writes down the message the essay seems to be
sending. It is an act of description, not judgment: it says "this paragraph claims leadership and
carries the clinic story," not "this paragraph is weak." Judgment is the review skills' job.

## When to run

Right after `system/Ingest`, before `meta/ClaimEvidenceMapper` and the targeted interview. Re-run only
if `Requirements` changes (a new prompt clause changes what each section must cover). It never re-runs
because the draft changed, because `draft-ingested` never changes.

## The Loop

**OBSERVE** — Read `EssayState.md`, `Drafts.md` (`draft-ingested`, its provisional `sec-N` split), and
`Requirements.md` (prompt clauses, limits).

**ANALYZE** — Decide the section cut. Default: one section per paragraph. Merge a one-line paragraph
into its neighbour when it is a continuation; split a paragraph only at a clear topic turn. Keep the
ids stable and ordered: `sec-1..N`. For each section identify: its **job** in the essay as written
(open, establish, complicate, turn, resolve), the **claims** it makes (virtue, event, outcome,
belief — the `ClaimEvidenceMapper` taxonomy), the **prompt clauses** it appears to answer, and the
**emotion** it reaches for. Then infer the **core message**: the one sentence the essay is arguing,
stated in the essay's own words where possible.

**PLAN** — One unit: write the three artifacts for the whole draft. This skill is cheap and pure, so
it does not split across runs.

**EXECUTE** —
- `Outline`: one row per section: `id, order, job, carries_message, carries_story (null until
  ClaimEvidenceMapper links it), carries_beat: null`.
- `SectionSpecifications`: one spec per section with `purpose` (the job as observed), `evidence: []`
  (nothing is evidenced yet), `claims: [<verbatim claim spans>]`, `emotion`, `covers_clauses`,
  `takeaway` (the reflective point the passage *makes*, or `none` if it only narrates).
- `MessageMap`: `core_message` with `inferred: true`, supporting themes as the draft names them, each
  marked `unsupported` until `ThemeDiscovery` finds ≥2 real experiences behind it.
- Update `Drafts.draft-ingested.sections` ids to match the final cut. The section *text* and
  `full_text` are untouched.

**VERIFY** — `assert ingest_preserved()` (the cut did not alter the text), `assert prompt_answered()`
(every prompt clause is covered by ≥1 section; a clause with no section is the first finding the
applicant will hear about), and `assert word_budget()` on the ingested text as-is (an over-limit
draft is a finding, not a blocker).

**LEARN** — Append a `RevisionHistory` entry listing the section cut and any uncovered prompt clause.

**UPDATE** — Upsert the three artifacts, recompute hashes, set `source_hashes` to the current `Drafts`
and `Requirements` hashes, update the EssayState rows, set `next_skill: ClaimEvidenceMapper`, bump
`updated`.

## Assertions

- `assert ingest_preserved()` — the section cut leaves `draft-ingested.full_text` byte-identical.
- `assert prompt_answered()` — each prompt clause maps to ≥1 section; on fail, the diagnostic names
  the clause and it becomes an `IngestReport` finding.
- `assert word_budget()` — the ingested draft is within limit; on fail, the diagnostic reports the
  overage and it becomes an `IngestReport` finding rather than blocking.

## Idempotency

Pure function of `draft-ingested` + `Requirements`. Re-running on unchanged inputs produces the same
cut, the same claims, and the same inferred message (modulo `updated`). Section ids never change once
assigned, so every downstream reference (`ClaimEvidenceMap.section`, `ReviewerFeedback.target_section`,
`IngestReport.passage`) stays valid.

## Output

```
REVERSE OUTLINE: <n> sections cut from draft-ingested (<w> words vs limit <l>)
CLAIMS: <k> claim spans recorded across sections (all unevidenced until the interview)
MESSAGE (inferred): "<core message>"
UNCOVERED CLAUSES: <none | clause ids>
NEXT: ClaimEvidenceMapper
```

## Gotchas

- **Describe, do not judge.** "This section restates the previous one" is a review finding; record
  it in `RevisionHistory` as an observation, but the review skills are the ones that turn it into a
  suggestion.
- **Never move text between sections.** A cut is a boundary, not an edit. If a paragraph genuinely
  belongs elsewhere, that is a suggestion for `PersonalizationReview`, subject to the applicant's
  decision.
- **`inferred: true` is load-bearing.** The message the essay *states* may not be the message the
  applicant *means*. `MessageMap` stays inferred until the interview confirms or replaces it.
- **Evidence starts empty on purpose.** The applicant's text proves nothing about their life until
  they confirm it. Do not pre-fill `evidence` from the prose.
