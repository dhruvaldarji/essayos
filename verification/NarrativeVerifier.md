---
skill: NarrativeVerifier
category: verification
purpose: Prove the draft holds together as a story — opening resolved, themes recurring, future goals present, growth visible — and record the verdicts in QualityMetrics.
reads: [Drafts, MessageMap, NarrativeModel]
writes: [QualityMetrics]
preconditions: [Drafts has a complete draft, MessageMap exists, NarrativeModel exists]
postconditions: [QualityMetrics has narrative verdicts for opening-resolution, theme recurrence, future goals, and growth, each with a located diagnostic on failure]
idempotency_key: verdicts upserted by stable id (check name + located span); re-run on unchanged Drafts + MessageMap + NarrativeModel is a no-op
asks_questions: false
---

# NarrativeVerifier (verification)

The story gate. Consistency proves the essay does not contradict itself; this skill proves it actually
*goes somewhere*. A draft can be coherent and still be flat: an opening image that is never paid off,
themes that never deepen, a person who does not change, an essay with no forward vector. This skill
checks the narrative arc against the plan the architecture phase committed to (`MessageMap`,
`NarrativeModel`). It writes verdicts; it never edits prose.

## When to run

After `ConsistencyChecker`, before `FinalReviewer`. Re-run any time `Drafts` changes, or when
`MessageMap` (the intended message per section) or `NarrativeModel` (the arc, turning point, and growth
trajectory) changes — both define what the narrative is *supposed* to do, so a change there can newly
expose a gap.

## The Loop

**OBSERVE** — Read `Drafts.md` (the draft under test), `MessageMap.md` (intended message per section),
and `NarrativeModel.md` (the arc: setup, turning point, growth, resolution, forward goals). Read
`LessonsLearned` for matching rules.

**ANALYZE** — Run the four narrative checks and locate every gap:
1. **Opening resolved** — a concrete image, idea, or question from the opening must recur, transformed,
   in the conclusion. Flag an opening hook that is raised and abandoned (the most common arc failure).
2. **Themes recur** — each theme the `NarrativeModel` commits to should appear and *deepen* across
   sections, not just be restated. Flag a theme that is named but never developed.
3. **Future goals present** — the essay must point forward (the physician/colleague the applicant
   intends to become), not end inside the past. Flag a draft with no forward vector or a goal that is
   generic rather than grounded in the arc just told.
4. **Growth visible** — there must be a before/after the reader can see: a turning point and a changed
   person on the far side of it. Flag an essay where things happen but no one changes.

**PLAN** — Choose the **single highest-severity** gap to write up this loop (an unresolved opening and
invisible growth outrank a thin theme or a generic goal). One verdict per loop, located.

**EXECUTE** — Record the verdict in `QualityMetrics.assertions[]`: the check, pass/fail, and on failure
the located diagnostic (which span fails, against which `NarrativeModel`/`MessageMap` element, and a
direction for repair).

**VERIFY** — Run the assertions below via `kernel/AssertionEngine`. A verdict with no location blocks
UPDATE until located.

**LEARN** — Append a `RevisionHistory` entry for each failure (Issue / Cause — usually upstream in
NarrativeModel or MessageMap / Fix direction / Outcome pending). If a gap type recurs ≥2 times, the
LearningLayer promotes a lesson.

**UPDATE** — Upsert the verdicts into `QualityMetrics` by stable id (check name + located span).
Recompute `hash`, set `source_hashes` to the current Drafts/MessageMap/NarrativeModel hashes, update
the `EssayState` row, bump `updated`. Hand back to the Orchestrator (failures route to RevisionLoop; a
gap whose cause is in `NarrativeModel`/`MessageMap` escalates upstream).

## Assertions

- `assert opening_resolves()` — the conclusion pays off an image/idea/question raised in the opening; a
  token or concept from the first paragraph recurs, transformed, in the last. On fail, the diagnostic
  names the opening hook that is never resolved.

(Theme recurrence, forward-goals presence, and visible growth are evaluated here against
`NarrativeModel` and `MessageMap`; each gap is written as a located `QualityMetrics` verdict and routed
the same way. A gap whose root cause is a missing element in the upstream model is escalated, not
patched into the prose.)

## Idempotency

Pure evaluation over the artifacts: identical inputs ⇒ identical verdicts and diagnostics. Each verdict
is upserted by stable id, so re-checking an unchanged draft replaces verdicts in place and writes only
`updated`. When the draft or an upstream model changes, only the checks whose `source_hashes` drifted
are re-evaluated; passing verdicts are preserved.

## Output

```
NARRATIVE: opening-resolved <p|f> · themes-recur <p|f> · future-goals <p|f> · growth-visible <p|f>
ASSERTIONS: opening_resolves <p|f>
TOP FINDING: <check> — <located diagnostic>
NEXT: RevisionLoop (gap to repair) | FinalReviewer (clean) | Architecture (upstream cause)
```

## Gotchas

- **An opening hook is a promise.** If paragraph one raises an image and the conclusion never returns
  to it, the reader feels the debt even if they cannot name it. Resolve it or cut it.
- **Restating a theme is not deepening it.** Recurrence must add meaning; flag the restatement.
- **Forward goals must be earned by the arc.** A generic "I want to help people" tacked on the end is a
  gap, not a resolution — the goal should fall out of the story just told.
- **No change, no essay.** If the same person walks in and out, the turning point is missing; that is
  usually a `NarrativeModel` cause, so escalate rather than patch.
- **Record verdicts, never rewrite.** This skill gates; RevisionLoop repairs under the ratchet.
