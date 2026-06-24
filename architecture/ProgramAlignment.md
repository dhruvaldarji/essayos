---
skill: ProgramAlignment
category: architecture
purpose: Map the applicant's arc onto what the specific program values, producing Past Self / Current Self / Future Physician / Program Fit.
reads: [EssayState, ApplicantModel, ThemeGraph, Requirements]
writes: [ProgramFitModel]
preconditions: [ApplicantModel is ok, ThemeGraph is ok, Requirements is ok]
postconditions: [ProgramFitModel has past_self, current_self, future_physician, program_fit each grounded in real experiences or program signals]
idempotency_key: upsert ProgramFitModel by essay_id; recompute only if source_hashes of ApplicantModel/ThemeGraph/Requirements changed
asks_questions: false
---

# ProgramAlignment (architecture)

Builds the bridge between who the applicant is and what the program wants. It constructs four linked
frames — **Past Self**, **Current Self**, **Future Physician**, **Program Fit** — and shows the arc
through them lands precisely on the values the target program states or signals. Where the program is
generic (`Requirements.program == null`), Program Fit degrades gracefully to specialty-level values.

## When to run

After `NarrativeArchitecture` has set the spine, before `MessageMap`. Re-run when `ApplicantModel`,
`ThemeGraph`, or `Requirements` (especially `program`) changes — the fit argument is only valid
against the current program signals and the current self.

## The Loop

**OBSERVE** — Read `EssayState.md`, `Requirements` (`prompt`, `program`, `essay_type`),
`ApplicantModel`, `ThemeGraph`. Extract program signals from `Requirements` (named values, mission
language, the "why this program" clause if present). If `program` is null, fall back to
specialty-level values implied by `essay_type`.

**ANALYZE** — Determine the gap across four frames:

- **Past Self** — where the applicant started: the origin experiences and motivations in
  `ApplicantModel` that explain *why* this path. Grounded in real experience ids.
- **Current Self** — who they are now: present competencies and themes (from `ThemeGraph`) that the
  experiences demonstrate. What is *shown*, not claimed.
- **Future Physician** — the trajectory: the kind of physician the arc points toward, stated as a
  direction the evidence already implies (never aspiration with no root).
- **Program Fit** — the join: for each salient program value, the specific Current-Self competency or
  Future-Physician direction that matches it, cited to an experience id. A value with no applicant
  evidence is a fit *gap*, recorded, not fabricated.

**PLAN** — Pick the smallest set of program values to align on (the ones the prompt actually
rewards), and for each, the single best-supporting frame element. Do not write fit prose.

**EXECUTE** — Write `ProgramFitModel`: the four frames, each as structured entries with `id`,
content, and `grounded_in: [<exp id>...]` (or `program_signal: <quote>` for program-side items). The
`program_fit[]` list pairs `program_value` ↔ `applicant_evidence (exp id)` ↔ `frame` (current/future).
Record any program value with no backing as a `fit_gaps[]` entry.

**VERIFY** — Run the assertions below via `kernel/AssertionEngine`. A failed `evidence_exists` or
`claim_traceable` blocks UPDATE: a fit claim with no real experience is fabrication. Either ground it
in an existing experience or move it to `fit_gaps[]` and route surfacing of the gap back to the
Orchestrator → Discovery.

**LEARN** — Append a `RevisionHistory` entry: which program values aligned, which became fit gaps, and
why. If a reusable insight emerged (e.g. "program weights research; applicant's evidence is clinical —
fit gap to surface"), append to `LessonsLearned`.

**UPDATE** — Upsert `ProgramFitModel` by `essay_id`. Recompute `hash`; set `source_hashes` to current
`ApplicantModel`, `ThemeGraph`, `Requirements` hashes. Set `EssayState.next_skill: MessageMap`; bump
`EssayState.updated`.

## Assertions

- `assert evidence_exists(fit_claim)` — every program-fit pairing is *shown* by a specific experience,
  not asserted as a bare virtue.
- `assert claim_traceable(fit_claim)` — each fit claim links to a real `ExperienceDatabase` id; no
  fabricated fit.
- `assert prompt_answered()` — if the prompt has a "why this program" clause, `program_fit[]` covers
  it; an uncovered clause blocks UPDATE.

## Idempotency

Upsert `ProgramFitModel` by `essay_id`. On OBSERVE, if recorded `source_hashes` match current
upstream hashes, no-op — report "no change." Identical inputs produce a byte-identical model (modulo
`updated`). Re-running never duplicates frame entries; it replaces them by `id`.

## Output

```
FRAMES:     past_self, current_self, future_physician built
PROGRAM:    <program or "generic (specialty-level)">
FIT:        <n values aligned, n fit_gaps>
ASSERTIONS: <k>/<n> passed
NEXT:       MessageMap
```

## Gotchas

- **Fit is shown, never asserted.** "I am a great fit for your collaborative culture" is a claim;
  "the free-clinic team I co-ran [exp:e12] demonstrates the collaboration the program names" is fit.
- **Never fabricate to close a fit gap.** If the program values something the applicant has not lived,
  it is a `fit_gaps[]` entry to surface — not a sentence to invent. The applicant is the only source
  of truth.
- **Future Physician must have roots.** State the trajectory the evidence already implies; do not write
  an aspirational future with no experience pointing at it.
- **Generic programs still get fit.** When `program` is null, align to specialty-level values from
  `essay_type` rather than skipping the frame.
- **No prose.** Output structured frames and value↔evidence pairings, not paragraphs.
