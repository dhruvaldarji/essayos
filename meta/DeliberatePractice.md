---
skill: DeliberatePractice
category: meta
purpose: Improve one quality dimension at a time — pick the lowest-scoring QualityMetrics dimension and drill only it — instead of editing everything at once.
reads: [EssayState, QualityMetrics, ReviewerFeedback, Drafts, SectionSpecifications]
writes: [ReviewerFeedback]
preconditions: [QualityMetrics exists with per-dimension scores, Drafts has a working draft]
postconditions: [ReviewerFeedback holds a practice block targeting exactly one dimension: the located fixes that raise it, scoped to leave other dimensions untouched]
idempotency_key: targeted dimension + fix set upserted by stable id (dimension + section + span); re-run on unchanged QualityMetrics + Drafts is a no-op
asks_questions: false
---

# DeliberatePractice (meta)

Improvement is fastest when it is focused. Editing every dimension of a draft at once is how good
sections regress while you chase a weak one — and it's exactly what the best-draft ratchet forbids.
DeliberatePractice imports the discipline of deliberate practice: identify the single weakest dimension,
drill *only* it, and leave everything else alone. One dimension, one round. The ratchet does the rest —
a round is accepted only if it raises `overall` by at least `ε` without regressing another dimension. It
flags the targeted, located fixes; the RevisionLoop applies them under the ratchet.

## When to run

In the convergence loop, whenever the score is below threshold but no single failure is catastrophic —
the steady-improvement regime. Especially after `RootCauseAnalysis` has confirmed the weakness is in the
prose (not upstream evidence). Re-run each round; each round targets whatever the lowest dimension now is.
Re-run when `QualityMetrics` or `Drafts` changes.

## The one-dimension discipline

| Step | Obligation |
|------|-----------|
| **Pick the weakest** | read per-dimension scores in `QualityMetrics`; target the single lowest. Ties broken by largest gap to threshold. |
| **Drill only it** | propose fixes that move *that* dimension and only that dimension — scoped to specific spans, never a broad rewrite. |
| **Hold the rest** | a proposed fix that would regress any other dimension is rejected before it's recorded. |
| **Honor the ratchet** | the round is accepted only if `overall` rises by ≥ ε against the best draft; otherwise it's rejected and the loop may terminate. |

## The Loop

**OBSERVE** — Read `EssayState.md`, `QualityMetrics.md` (per-dimension scores, threshold, ceiling, best),
`ReviewerFeedback` (located diagnostics by dimension), `Drafts.md`, and `SectionSpecifications.md`. Read
`LessonsLearned` for drills that have raised this dimension before.

**ANALYZE** — Identify the single lowest dimension and its gap to threshold. Determine staleness: if a
practice block for this dimension exists and `QualityMetrics` + `Drafts` are unchanged, the prior drill
stands — skip. Confirm the ceiling supports further gain on this dimension (if not, hand back — this is a
Discovery problem, not a practice one).

**PLAN** — Choose the targeted dimension (the weakest) and the specific spans whose fix would lift it. One
dimension per loop. Plan the fixes to be localized so they cannot touch other dimensions.

**EXECUTE** — Produce the located, dimension-scoped fixes (drawn from the matching `ReviewerFeedback`
diagnostics). For each, predict its effect on the targeted dimension and confirm it leaves the others
unmoved. Do not propose a fix that improves the target by harming a neighbor.

**VERIFY** — Run the assertions below via `kernel/AssertionEngine`. The targeted dimension's fixes must
pass its corresponding assertion, and `monotonic_improvement` must confirm the round clears ε without
regression — a round that doesn't is rejected, not recorded as progress.

**LEARN** — Append a `RevisionHistory` entry for the round (Issue = the weak dimension, Cause, Fix = the
drill, Outcome = ε-cleared or rejected). A drill that reliably lifts a given dimension becomes a
`LessonsLearned` rule.

**UPDATE** — Upsert the practice block into `ReviewerFeedback` by stable id (dimension + section + span).
Recompute `hash`, set `source_hashes`, update the `EssayState` row, bump `updated`. Hand to the RevisionLoop
to apply under the ratchet, then back to the Orchestrator.

## Assertions

- `assert monotonic_improvement()` — the round raises `overall` by ≥ ε against the best draft; if not, it
  is rejected. On fail, the diagnostic reports the delta and that it is < ε.
- `assert voice_consistent()` — drilling one dimension must not let another section drift in voice. On
  fail, the diagnostic names the drifting section (a regression the round must avoid).
- `assert redundancy_low()` — a fix for one dimension must not introduce repetition elsewhere. On fail, the
  diagnostic quotes the repeated span (a regression the round must avoid).

## Idempotency

The targeted dimension and its fix set are upserted by stable id; re-running on unchanged metrics and draft
reproduces the same drill in place and writes only `updated`. When metrics or draft change, the weakest
dimension is recomputed and the drill re-targets. Identical inputs ⇒ identical practice block.

## Output

```
DELIBERATE PRACTICE: targeting <dimension> (lowest, <x.xx> vs threshold <x.xx>)
FIXES: <n> located, scoped to <dimension> only
RATCHET: round Δoverall <±x.xx> (ε <0.02>) → ACCEPT | REJECT
NO REGRESSION: other dimensions unmoved <yes|no>
ASSERTIONS: monotonic_improvement <p|f> · voice_consistent <p|f> · redundancy_low <p|f>
NEXT: RevisionLoop (apply drill) | Orchestrator (round rejected, loop may terminate)
```

## Gotchas

- **One dimension per round, always.** Editing everything at once is how the ratchet gets broken and good
  sections regress. Pick the weakest and drill only it.
- **A fix that helps the target by harming a neighbor is a regression, not progress.** Reject it before it
  reaches the draft; the ratchet would reject the whole round anyway.
- **Honor the ratchet's ε-or-stop.** A round that can't clear ε on the weakest dimension is the signal to
  terminate at best, not to loosen the bar.
- **Check the ceiling first.** If the weakest dimension can't rise because the evidence won't support it,
  this is a Discovery problem — hand back rather than drilling prose that can't improve.
- **Flag, never apply.** This skill selects the dimension and the located fixes; the RevisionLoop makes the
  ratchet-gated change.
