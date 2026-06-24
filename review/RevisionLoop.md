---
skill: RevisionLoop
category: review
purpose: Turn reviewer findings into localized, ratchet-gated fixes — Issue to Root Cause to Fix to Localized Revision to Reverify to History — never broad rewrites.
reads: [ReviewerFeedback, Drafts, QualityMetrics, LessonsLearned]
writes: [Drafts, RevisionHistory]
preconditions: [ReviewerFeedback has at least one open finding, Drafts has a best draft, QualityMetrics exists]
postconditions: [each addressed finding has a RevisionHistory record; Drafts.best is replaced only by a higher-scoring candidate; no broad rewrite occurred]
idempotency_key: each revision keyed by stable id (finding id + draft hash before fix); the same finding against the same draft is fixed once, never re-applied
asks_questions: false
---

# RevisionLoop (review)

The heart of convergence. Everything upstream produces findings; this skill is where findings become a
better essay — safely. It does one thing per loop: take a single finding, trace it to its root cause,
make the **smallest** change that fixes it, score the result against the **best draft so far**, and
keep the change only if it crosses the ε bar. This is the ratchet from `kernel/Orchestrator.md` made
operational. It mutates `Drafts`, so it obeys the ratchet absolutely.

## When to run

Whenever `ReviewerFeedback` has open findings (from AuthenticityAuditor, CommitteeReview, or the
verification skills). Runs in the convergence loop the Orchestrator manages: Review → RevisionLoop →
Verification, repeating until the ratchet says stop.

## The Loop

**OBSERVE** — Read `ReviewerFeedback.md` (open findings), `Drafts.md` (both `best/` and `working/`),
`QualityMetrics.md` (current `overall` and `ceiling`), and `LessonsLearned.md`. **Always consult
LessonsLearned first** — if a rule's trigger matches this finding, apply the rule rather than
rediscovering the fix.

**ANALYZE** — Select the single highest-value open finding (convergent concerns flagged by multiple
reviewers first; then highest severity). Then run the five-step diagnosis:
1. **Issue** — the verbatim finding/diagnostic (location + failing dimension).
2. **Root Cause** — *why* the prose is wrong, not the symptom. "Reflection missing" is the issue; "the
   SectionSpecification asked for an event, not a takeaway" is the cause. Per LearningLayer, the cause
   is always in the process, never the applicant.
3. **Fix** — the smallest change that resolves the cause. Name the target span and the change.

**PLAN** — Scope the fix to **one section or one claim**. If the honest fix would touch multiple
sections, that is a signal the cause is upstream (a wrong message or theme) — record it and route to
the Orchestrator's stall escalation instead of attempting a broad rewrite. **Broad rewrites are
forbidden by the ratchet.**

**EXECUTE** — Make the **Localized Revision** in `working/` only. Touch nothing outside the targeted
span. `best/` is never edited directly.

**VERIFY** — **Reverify**: re-run the assertions the finding implicated and recompute `QualityMetrics`
for the candidate. Then apply the ratchet via `assert monotonic_improvement()`:
- Score the candidate against `best/`, **not** `working/`.
- **Accept-only:** if the candidate scores below `best`, reject — `best` is unchanged.
- **ε-improvement:** accept only if `overall` rises by ≥ `epsilon` (default `0.02`). A sub-ε gain is
  rejected and counts toward loop termination (two consecutive rejected rounds end convergence at
  `best`).
- A localized fix that resolves the finding but does not move `overall` by ε is still rejected as a
  draft replacement, though the finding is marked addressed.

**LEARN** — Append a `RevisionHistory` entry: `issue` (the diagnostic), `cause` (root cause), `fix`
(the localized change), `outcome` (the quality delta and which assertions now pass), `by`
(RevisionLoop). If this is the ≥2nd occurrence of the same cause, the LearningLayer promotes a
`LessonsLearned` rule so the next round prevents it.

**UPDATE** — If accepted, promote the candidate: `best/ ← working/` and upsert the revised section in
`Drafts` by id. Mark the finding resolved in `ReviewerFeedback`. Recompute `Drafts.hash`, update the
`EssayState` row, set `quality_overall`, bump `updated`. Hand back to the Orchestrator, which decides
the next Review/Verification step.

## Assertions

- `assert monotonic_improvement()` — the candidate scores ≥ `best` by ≥ ε. On fail, the diagnostic
  reports the delta and that it is below ε; the candidate is discarded and `best` stands. This is the
  gate that makes convergence terminate instead of thrash and guards good sections from regression.

(The RevisionLoop also re-runs whichever assertion the finding implicated — e.g.
`reflection_present`, `evidence_exists`, `voice_consistent` — to confirm the localized fix actually
resolved the issue before scoring.)

## Idempotency

Each revision is keyed by `finding id + pre-fix draft hash`. Applying the same fix to the same draft
twice is a no-op — the second pass sees the finding already resolved against that draft hash and writes
nothing but `updated`. `RevisionHistory` is upsert-by-id (never delete; supersede), so the trail is
complete and duplicate-free. A rejected candidate leaves `Drafts.best` byte-identical.

## Output

```
FINDING: <id> — "<issue>" @ <section>
CAUSE:   <root cause, process-level>
FIX:     <localized change> @ <span>
RATCHET: candidate <x.xx> vs best <x.xx> · ε <0.02> → ACCEPT | REJECT (Δ <±x.xx>)
HISTORY: rev-<n> recorded · lesson-<n> promoted | none
NEXT:    Orchestrator (Review/Verification step)
```

## Gotchas

- **Score against `best`, never `working`.** Scoring against the live mutable draft is how convergence
  silently regresses. The ratchet exists precisely to forbid this.
- **One section or one claim. A multi-section fix is an upstream-cause signal, not a license to
  rewrite.** Escalate to the Orchestrator instead.
- **Consult LessonsLearned before diagnosing.** The whole point of the learning layer is to not
  rediscover a fix you already paid for.
- **A sub-ε round is a stop signal, not a failure.** Two consecutive rejected rounds end convergence at
  `best` — that is the system terminating honestly, not breaking.
- **Cause is process, never person.** A thin scene means the interview question was too broad, not that
  the applicant failed. Fix the cause upstream when you can.
- **Never edit `best/` in place.** Promote a verified candidate; do not mutate the champion.
