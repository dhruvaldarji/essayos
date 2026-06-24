---
skill: Inversion
category: meta
purpose: Ask "what would make this essay FAIL?" — enumerate the failure modes, then verify the essay avoids each one.
reads: [EssayState, Drafts, Requirements, ProgramFitModel, ReviewerFeedback, ClaimEvidenceMap]
writes: [ReviewerFeedback]
preconditions: [Drafts has a working draft, Requirements exists]
postconditions: [ReviewerFeedback holds an inversion block: each enumerated failure mode marked avoided or present, with present ones located]
idempotency_key: each failure-mode check upserted by stable id (failure_mode + section); re-run on unchanged Drafts + Requirements + ProgramFitModel is a no-op
asks_questions: false
---

# Inversion (meta)

It is often easier to see what guarantees failure than what guarantees success. Inversion (Munger's move)
flips the question: instead of "how do I make this essay great?", it asks "what would make a reviewer
reject this?" — then enumerates those failure modes concretely and checks the draft against each. Avoiding
every known way to fail is not the same as being great, but it is a precondition for it, and the failure
modes are far more enumerable than the success factors. It flags failure modes present in the draft; it
never rewrites.

## When to run

Before Verification on any complete draft, and any time the path to a higher score is unclear — inverting
to "what's dragging it down?" is often more tractable than "what would lift it up?". Re-run after revision
rounds to confirm fixes didn't introduce a new failure mode. Re-run when `Drafts`, `Requirements`, or
`ProgramFitModel` changes.

## The failure-mode catalog

The standard ways an application essay fails — enumerated so each can be checked for, not just hoped
against:

| Failure mode | Present when |
|--------------|--------------|
| **Doesn't answer the prompt** | a prompt clause has no section addressing it |
| **Generic / interchangeable** | any applicant could have written it; nothing is specifically *this* person |
| **Tells, never shows** | virtues asserted as adjectives with no experience behind them |
| **No reflection** | events narrated with no insight into what they changed |
| **Cliché / performed** | template sentiments or manufactured vulnerability |
| **Inconsistent / contradictory** | timeline conflicts, claims that fight each other |
| **Wrong fit** | values misaligned with the target program |
| **Over/under budget** | outside the prompt's word/character limit |
| **Forgettable** | nothing survives a 60-second read |

## The Loop

**OBSERVE** — Read `EssayState.md`, `Drafts.md` (working draft), `Requirements.md`, `ProgramFitModel.md`,
`ReviewerFeedback` (failure modes others already spotted), and `ClaimEvidenceMap.md`. Read `LessonsLearned`
for failure modes that recur for this applicant.

**ANALYZE** — Determine staleness against Drafts + Requirements + ProgramFitModel. If unchanged, prior
verdicts stand — skip. Otherwise, scope which sections changed.

**PLAN** — Choose the next failure mode to check against the in-scope material. One failure mode per loop,
checking the most essay-fatal ones first (doesn't-answer-prompt, contradictory).

**EXECUTE** — Check the draft for that failure mode. Mark it **avoided** (with the evidence that it's
avoided) or **present** (with the exact location and severity). Avoiding a mode is as much a recorded
result as finding one — it tells the Orchestrator the essay is clear of that risk.

**VERIFY** — Run the assertions below via `kernel/AssertionEngine`. A "present" verdict must be located; a
mode marked avoided must actually pass its corresponding assertion.

**LEARN** — Append a `RevisionHistory` entry per failure mode found present (Issue / Cause / Fix direction /
Outcome pending). A failure mode that keeps reappearing for this applicant becomes a `LessonsLearned` rule.

**UPDATE** — Upsert each failure-mode verdict into the `ReviewerFeedback` inversion block by stable id
(failure_mode + section). Recompute `hash`, set `source_hashes`, update the `EssayState` row, bump
`updated`.

## Assertions

- `assert prompt_answered()` — backs the doesn't-answer-the-prompt mode. On fail, the diagnostic names the
  unaddressed clause.
- `assert timeline_consistent()` — backs the inconsistent/contradictory mode. On fail, the diagnostic
  quotes the conflicting markers.
- `assert authenticity_preserved()` — backs the cliché/performed and generic modes. On fail, the
  diagnostic quotes the offending line and the failing dimension.
- `assert word_budget()` — backs the over/under-budget mode. On fail, the diagnostic reports the over/under
  by N.

## Idempotency

Each failure-mode verdict is upserted by stable id; re-checking an unchanged section replaces its verdict
in place. A re-run over unchanged inputs changes no verdict and writes only `updated`. When the draft
changes, only affected modes/sections are re-checked. Identical inputs ⇒ identical inversion block.

## Output

```
INVERSION: <n> failure modes checked
PRESENT: <n> (located) — <one line each>
AVOIDED: <n>
MOST FATAL PRESENT: <the failure mode most likely to cause rejection | none>
ASSERTIONS: prompt_answered <p|f> · timeline_consistent <p|f> · authenticity_preserved <p|f> · word_budget <p|f>
NEXT: RevisionLoop (eliminate present modes) | Verification (all avoided)
```

## Gotchas

- **Enumerate failure exhaustively before checking.** The power of inversion is coverage — a mode you don't
  name is a mode you don't check for.
- **"Avoided" is a real, recorded result.** Don't only log problems; logging cleared risks tells the
  Orchestrator the essay is safe on that axis.
- **Avoiding all failure modes ≠ excellence.** Inversion clears the floor; it does not raise the ceiling.
  Hand a clean draft on to skills that build distinction.
- **Locate every present mode.** "Feels generic" is not actionable; "this paragraph could be any
  applicant's, here's the span" is.
- **Flag, never fix.** The output is verdicts and locations; the RevisionLoop makes the change.
