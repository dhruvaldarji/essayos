---
skill: FinalReviewer
category: verification
purpose: Score the draft on seven dimensions, return READY_FOR_SUBMISSION YES|NO with rationale, and set EssayState.converged when the bar is met.
reads: [Drafts, QualityMetrics, Requirements, ProgramFitModel]
writes: [QualityMetrics, EssayState]
preconditions: [Drafts.best is a complete draft, QualityMetrics exists, Requirements exists, ProgramFitModel exists]
postconditions: [QualityMetrics has seven dimension scores + overall + READY_FOR_SUBMISSION verdict; EssayState.converged is set true iff YES and overall >= quality_threshold]
idempotency_key: the verdict is a pure function of the inputs; re-run on unchanged Drafts + QualityMetrics + Requirements + ProgramFitModel reproduces the same scores and writes only updated
asks_questions: false
---

# FinalReviewer (verification)

The submission gate. Everything before this produces findings and verdicts; this skill renders the
single judgment that matters: is the essay ready to send? It scores the `best` draft on seven
dimensions, rolls them into `overall`, and returns `READY_FOR_SUBMISSION: YES|NO` with a rationale that
names exactly what is holding it back. It is the only skill that may set `EssayState.converged`. It
scores; it never edits prose.

## When to run

Last skill in the pipeline, after `ConsistencyChecker` and `NarrativeVerifier` are clean and after each
convergence round. Re-run any time `Drafts.best` changes, or when `Requirements` or `ProgramFitModel`
changes (both define the bar). Always scores `best`, never `working`.

## The Loop

**OBSERVE** — Read `Drafts.md` (`best/`), `QualityMetrics.md` (the assertion verdicts and prior
scores), `Requirements.md` (prompt, word/char limit), and `ProgramFitModel.md` (target program
values). Read `LessonsLearned` for matching rules.

**ANALYZE** — Confirm the prerequisites for a clean score: all upstream assertions in `QualityMetrics`
pass (authenticity, consistency, narrative). If any upstream assertion is failing, the verdict is `NO`
without further scoring — route back to RevisionLoop. Otherwise score the seven dimensions, each on
`0–1`:
1. **authenticity** — virtues shown not stated, no cliché/exaggeration/performance (from AuthenticityAuditor).
2. **specificity** — concrete scenes, named detail, no generality.
3. **reflection** — insight and growth present, not just description.
4. **voice** — one consistent, recognizably-the-applicant voice.
5. **flow** — sections connect; transitions earn their place; arc moves.
6. **memorability** — at least one thing survives a fast read (the Busy Reviewer's bar).
7. **program fit** — answers the prompt and matches `ProgramFitModel` values.

**PLAN** — Compute `overall` as the (weighted) roll-up of the seven dimensions. Decide the verdict:
`READY_FOR_SUBMISSION: YES` **iff** every dimension clears its floor *and* `overall ≥
EssayState.quality_threshold`; otherwise `NO` with the binding constraint named (the lowest dimension
or the failing assertion).

**EXECUTE** — Write the seven dimension scores, `overall`, and the `READY_FOR_SUBMISSION` verdict with
its rationale into `QualityMetrics`.

**VERIFY** — Run the assertions below via `kernel/AssertionEngine`. `word_budget` and `prompt_answered`
are hard gates: a draft over limit or not answering the prompt cannot be `YES` regardless of score.

**LEARN** — Append a `RevisionHistory` entry recording the verdict and the binding constraint (Issue =
the lowest dimension / Cause / Fix direction / Outcome). On a stall (verdict stuck `NO` with no
ε-progress across rounds), record it so the Orchestrator escalates.

**UPDATE** — Upsert scores and verdict into `QualityMetrics`. Update `EssayState`: set `quality_overall`,
`quality_ceiling`, and — **only if `READY_FOR_SUBMISSION: YES` and `overall ≥ quality_threshold`** —
set `converged: true` and `next_skill: null`, `phase: done`. Otherwise leave `converged: false` and let
the Orchestrator route the next revision step. Recompute `hash`, set `source_hashes`, bump `updated`.

## Assertions

- `assert word_budget()` — the `best` draft is within the prompt's word/character limit. On fail, the
  diagnostic reports over/under by N; verdict cannot be YES.
- `assert prompt_answered()` — every clause of the stated prompt maps to a section. On fail, the
  diagnostic names the unaddressed clause; verdict cannot be YES.

(The seven dimension scores draw on the assertion verdicts the upstream skills already recorded in
`QualityMetrics`; FinalReviewer consolidates rather than re-deriving them, and refuses YES if any
upstream assertion is failing.)

## Idempotency

The verdict is a pure function of the inputs: identical `Drafts.best` + `QualityMetrics` +
`Requirements` + `ProgramFitModel` ⇒ identical seven scores, identical `overall`, identical
`READY_FOR_SUBMISSION`. A re-run on unchanged inputs writes only `updated`. `converged` is set
deterministically from the verdict and threshold, never by guess; it flips back to `false` if a later
change to `best` drops `overall` below threshold.

## Output

```
SCORES: auth <x.xx> · spec <x.xx> · refl <x.xx> · voice <x.xx> · flow <x.xx> · mem <x.xx> · fit <x.xx>
OVERALL: <x.xx> / threshold <x.xx> / ceiling <x.xx>
ASSERTIONS: word_budget <p|f> · prompt_answered <p|f>
VERDICT: READY_FOR_SUBMISSION: YES|NO — <binding constraint / rationale>
STATE: converged <true|false>
NEXT: null (converged) | RevisionLoop (<lowest dimension>) | GrillMe (ceiling < threshold)
```

## Gotchas

- **Score `best`, never `working`.** The submission verdict is about the champion draft; scoring the
  scratch draft would let a worse candidate pass.
- **Hard gates override the score.** Over the word limit or not answering the prompt = `NO`, no matter
  how high the seven dimensions read.
- **Never raise the threshold to force a YES.** The threshold is the applicant's bar. If `ceiling <
  threshold`, the honest move is route to Discovery for more evidence, not move the goalpost.
- **`converged` is deterministic, not aspirational.** Set it only when the verdict is YES *and* overall
  clears threshold; a single failing upstream assertion forbids it.
- **A persistent `NO` with no ε-progress is a stall, not a verdict to repeat.** Record it; the
  Orchestrator escalates to RootCauseAnalysis / Council / RedTeam.
- **Score, never rewrite.** FinalReviewer judges; RevisionLoop repairs under the ratchet.
