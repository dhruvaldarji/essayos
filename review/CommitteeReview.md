---
skill: CommitteeReview
category: review
purpose: Simulate four admissions reviewers (Program Director, Faculty Member, Busy Reviewer, Skeptic) and capture each one's strengths, concerns, memorability, and suggestions.
reads: [Drafts, Requirements, ProgramFitModel]
writes: [ReviewerFeedback]
preconditions: [Drafts has a complete working draft, Requirements exists, ProgramFitModel exists]
postconditions: [ReviewerFeedback has a per-persona block for all four reviewers, each with strengths/concerns/memorability/suggestions and located diagnostics]
idempotency_key: per-persona findings upserted by stable id (persona + section + claim); re-run on unchanged Drafts + Requirements + ProgramFitModel is a no-op
asks_questions: false
---

# CommitteeReview (review)

The mock committee. A real essay is not read once by an ideal reader — it is read by four very
different people with four different jobs and four different attention budgets. This skill runs the
draft past all four and records what each one actually sees, so revision targets the reader who will
decide, not an imaginary average. Each persona is a specialist agent in `specialists/`; this skill is
the orchestration that invokes them and consolidates their feedback. It flags; it does not rewrite.

## When to run

After `AuthenticityAuditor` on a complete draft, and any time `Drafts` changes after a revision round.
Re-run when `Requirements` (the prompt) or `ProgramFitModel` (the target program's values) changes —
both shift what the committee is reading *for*.

## The four reviewers

Each maps to a specialist agent and reads with a distinct lens:

| Persona | Specialist | Reads for | Attention budget |
|---------|-----------|-----------|------------------|
| **Program Director** | `specialists/ProgramDirector.md` | fit, judgment, will-this-person-thrive-here | careful, decision-weight |
| **Faculty Member** | `specialists/PhysicianMentor.md` | clinical/identity credibility, is this a real colleague | careful, domain-critical |
| **Busy Reviewer** | `specialists/Skeptic.md` (skim mode) | the gist in **60 seconds** — does anything land, is it memorable | one fast pass, no re-reads |
| **Skeptic** | `specialists/Skeptic.md` | weak/unbacked claims, generic phrasing, anything that smells manufactured | adversarial, line-level |

(The Busy Reviewer and Skeptic share the Skeptic specialist but are invoked with different prompts:
one skims for landing, one attacks for weakness.)

## The Loop

**OBSERVE** — Read `Drafts.md` (working draft), `Requirements.md` (prompt + limits), and
`ProgramFitModel.md` (program values to evaluate fit against). Read `LessonsLearned` for rules whose
trigger matches.

**ANALYZE** — Determine which personas are stale: a persona block whose `source_hashes` no longer
match the current Drafts/Requirements/ProgramFitModel hashes must be re-run; fresh blocks are skipped.

**PLAN** — Choose the next stale persona to run (Program Director → Faculty → Busy Reviewer → Skeptic
order, so cheaper-to-fix structural notes precede line-level attacks). One persona per loop.

**EXECUTE** — Invoke that persona's specialist agent on the draft with its lens. Collect exactly four
outputs from it: **strengths** (what works, located), **concerns** (what fails, located),
**memorability** (the one thing, if any, that would survive the read — for the Busy Reviewer this is
the whole verdict), and **suggestions** (direction for repair, not rewrites).

**VERIFY** — Run the assertions below via `kernel/AssertionEngine`. Every concern a persona raises must
be located (section + span); an unlocated concern is rejected and sent back to the persona.

**LEARN** — Append a `RevisionHistory` entry for each substantive concern (Issue / Cause / Fix
direction / Outcome pending). If two personas independently flag the same span, that convergence is a
strong signal — note it for the RevisionLoop's prioritization and promote a lesson if recurring.

**UPDATE** — Upsert the persona's block into `ReviewerFeedback` by stable id (persona + section +
claim). Recompute `hash`, set `source_hashes`, update the `EssayState` row, bump `updated`. When all
four blocks are fresh, hand back to the Orchestrator.

## Assertions

- `assert prompt_answered()` — the essay answers every clause of the stated prompt; the Program Director
  persona's fit verdict depends on this. On fail, the diagnostic names the unaddressed clause.
- `assert evidence_exists(claim)` — claims the personas test are backed by a specific experience. On
  fail, the diagnostic lists the unbacked claims (the Skeptic's primary ammunition).
- `assert redundancy_low()` — no anecdote/phrase repeats without adding meaning; the Busy Reviewer
  punishes repetition hardest in a 60-second read. On fail, the diagnostic quotes the repeated span.

## Idempotency

Each persona block is upserted by stable id; re-running a persona on an unchanged draft replaces its
block in place. A re-run over unchanged inputs re-runs no persona (all blocks fresh) and writes only
`updated`. When the draft changes, only personas whose `source_hashes` drifted are re-invoked; the
other three blocks are preserved. Identical inputs ⇒ identical consolidated `ReviewerFeedback`.

## Output

```
COMMITTEE: <k>/4 personas fresh
PROGRAM DIRECTOR: <n> strengths · <n> concerns · memorability: <one line|none>
FACULTY:          <n> strengths · <n> concerns · memorability: <one line|none>
BUSY (60s):       lands: <yes|no> · memorability: <the one thing|nothing landed>
SKEPTIC:          <n> weak claims flagged
ASSERTIONS: prompt_answered <p|f> · evidence_exists <p|f> · redundancy_low <p|f>
NEXT: RevisionLoop (concerns to repair) | Verification (clean)
```

## Gotchas

- **The Busy Reviewer is the realistic case, not the pessimistic one.** Most committee reads are a fast
  skim. If nothing lands in 60 seconds, that is the finding — do not soften it.
- **Two personas on the same span = top priority.** Convergent concerns are the surest repairs; surface
  the overlap for the RevisionLoop.
- **Flag, never fix.** Suggestions are directions; the RevisionLoop makes the localized, ratchet-gated
  change.
- **Fit is the Program Director's call, evaluated against `ProgramFitModel`, not generic prestige.** A
  draft can be beautiful and still be a bad fit; record that honestly.
- **Do not average the four.** Keep the blocks distinct; a concern that only the Skeptic sees is still
  a real concern.
