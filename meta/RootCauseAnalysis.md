---
skill: RootCauseAnalysis
category: meta
purpose: When a quality score is stuck, ask "why" repeatedly to diagnose the underlying weakness rather than the surface symptom, and record the chain in the durable history.
reads: [EssayState, QualityMetrics, ReviewerFeedback, RevisionHistory, Drafts, ClaimEvidenceMap]
writes: [RevisionHistory]
preconditions: [QualityMetrics exists, a stall is recorded (same skill selected 3+ times without ε-progress)]
postconditions: [RevisionHistory holds a why-chain from symptom to root cause, with the corrective action that addresses the cause not the symptom]
idempotency_key: each diagnosis upserted by stable id (stalled_dimension + chain_hash); re-run on unchanged QualityMetrics + ReviewerFeedback is a no-op
asks_questions: false
---

# RootCauseAnalysis (meta)

A stuck score is a symptom. Revising the symptom — polishing the same paragraph a fourth time — is exactly
the churn the ratchet was built to stop. This skill is what the Orchestrator escalates to on a stall: it
asks "why is this dimension stuck?" repeatedly (the five-whys discipline) until it reaches a cause that, if
fixed, actually moves the score — usually upstream of the prose, in the message, the evidence, or the
narrative. The principle holds here as everywhere: if a human (or a skill) could keep making the same
mistake, the system allowed it — the root cause is structural, not a single bad sentence.

## When to run

Invoked by the Orchestrator on a stall: the same skill selected 3+ times without `QualityMetrics.overall`
improving by `ε`. Also run before raising effort or routing back to Discovery, so the re-spend is aimed at
the real cause. Re-run when `QualityMetrics` or `ReviewerFeedback` changes (new evidence may shift the
diagnosis).

## The five-whys discipline

Start from the stuck dimension and its diagnostic, then ask "why" until the answer is something the system
can change at its source:

1. **Symptom** — which `QualityMetrics` dimension is stuck, and by how much below threshold?
2. **Why is it stuck?** — what does `ReviewerFeedback` say keeps failing? (e.g. "reflection thin")
3. **Why does that keep failing?** — is the prose the problem, or the material? (e.g. "no growth captured")
4. **Why is the material missing?** — trace upstream: ExperienceGraph gap? ThemeGraph thin? Discovery
   never elicited it?
5. **Root cause** — the earliest fixable point. Stop when fixing it would plausibly move the score;
   "the writer should try harder" is never a root cause — it means Discovery owes more evidence.

A human-blaming or effort-blaming answer is a signal you stopped one why too early.

## The Loop

**OBSERVE** — Read `EssayState.md`, `QualityMetrics.md` (the stuck dimension + ceiling), `ReviewerFeedback`
(what keeps failing), `RevisionHistory` (what's already been tried — and failed), `Drafts.md`, and
`ClaimEvidenceMap.md`. Read `LessonsLearned` for prior root causes of this dimension.

**ANALYZE** — Confirm the stall is real (3+ selections, no ε-progress). Determine staleness: if a diagnosis
for this dimension exists and `QualityMetrics` + `ReviewerFeedback` are unchanged, the cause already found
stands — skip and re-surface it.

**PLAN** — Choose the single stuck dimension with the largest gap to threshold. One dimension's why-chain
per loop.

**EXECUTE** — Run the why-chain to the root cause. Cross-check against `RevisionHistory`: if prior fixes all
targeted the symptom, that itself is evidence the cause is upstream. Output the chain and a corrective
action aimed at the **cause** (e.g. "route to GrillMe to elicit the growth beat," not "rewrite the
paragraph").

**VERIFY** — Run the assertions below via `kernel/AssertionEngine`. The corrective action must address a
cause that, per the assertions, is genuinely failing — not a guess.

**LEARN** — This skill's primary output *is* the LEARN step: append a `RevisionHistory` entry with the full
chain (Issue = symptom, Cause = root cause, Fix = the cause-targeting action, Outcome pending). If the same
root cause recurs across dimensions or essays, promote it to `LessonsLearned`.

**UPDATE** — Upsert the diagnosis into `RevisionHistory` by stable id (stalled_dimension + chain_hash).
Recompute `hash`, set `source_hashes`, set `EssayState.next_skill` to the cause-targeting skill, bump
`updated`. Hand back to the Orchestrator.

## Assertions

- `assert reflection_present(section)` — if the stuck dimension is reflection, confirm the section truly
  lacks the growth turn before blaming the prose. On fail, the diagnostic quotes the description-only span.
- `assert theme_supported(theme)` — a stuck theme often means the evidence base is thin, not the writing.
  On fail, the diagnostic names the theme and its support count (the real root cause).
- `assert evidence_exists(claim)` — a stuck authenticity/credibility score often traces to an unbacked
  claim. On fail, the diagnostic lists the claims with no backing experience.

## Idempotency

Each diagnosis is upserted by stable id (dimension + chain hash); re-running on unchanged metrics and
feedback re-surfaces the same chain in place and writes only `updated`. When metrics or feedback change,
the chain is recomputed and may reach a new root cause. Identical inputs ⇒ identical diagnosis.

## Output

```
RCA: dimension <name> stuck at <x.xx> (threshold <x.xx>, gap <x.xx>)
WHY-CHAIN:
  1 symptom: <…>
  2 why: <…>
  3 why: <…>
  4 why: <…>
  5 root cause: <the earliest fixable point>
CORRECTIVE ACTION: <cause-targeting skill + what it must produce>
ASSERTIONS: reflection_present <p|f> · theme_supported <p|f> · evidence_exists <p|f>
NEXT: <the cause-targeting skill> (not the symptom-targeting one)
```

## Gotchas

- **Never stop at the symptom.** A polished-symptom fix is the churn the ratchet forbids. Keep asking why
  until you reach something upstream you can actually change.
- **Humans and effort are never root causes.** "The writer should reflect more" means Discovery never
  elicited the reflection — that is the system's gap, and that is where the fix goes.
- **Most stuck scores are evidence problems, not prose problems.** Check ThemeGraph/ExperienceGraph support
  before sending work back to the writer.
- **Diagnose, then hand off — don't fix here.** This skill writes the chain and points at the right skill;
  the named skill makes the change.
- **Respect the ceiling.** If the root cause is "the evidence cannot support this threshold," the corrective
  action is raise-the-ceiling (Discovery) or lower-the-bar (with applicant consent), never grind the loop.
