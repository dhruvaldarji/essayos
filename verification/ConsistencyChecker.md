---
skill: ConsistencyChecker
category: verification
purpose: Prove the draft is internally consistent across voice, theme, timeline, and identity, and record the verdicts in QualityMetrics.
reads: [Drafts, VoiceModel, ThemeGraph, ApplicantModel]
writes: [QualityMetrics]
preconditions: [Drafts has a complete draft, VoiceModel exists, ThemeGraph exists, ApplicantModel exists]
postconditions: [QualityMetrics has voice/theme/timeline/identity consistency verdicts, each with a located diagnostic on failure]
idempotency_key: verdicts upserted by stable id (check name + located span); re-run on unchanged Drafts + VoiceModel + ThemeGraph + ApplicantModel is a no-op
asks_questions: false
---

# ConsistencyChecker (verification)

The internal-coherence gate. A draft can be authentic line by line and still contradict itself: a
voice that drifts mid-essay, a theme that appears once and is abandoned, two dates that cannot both be
true, an "I" who is not the person the rest of the essay describes. This skill catches those. It does
not judge quality or fit — only consistency. It writes verdicts; it never edits prose.

## When to run

After the review pass, before `NarrativeVerifier` and `FinalReviewer`. Re-run any time `Drafts`
changes, or when `VoiceModel`, `ThemeGraph`, or `ApplicantModel` changes — each is a reference the
draft is checked *against*, so a change there can newly expose an inconsistency.

## The Loop

**OBSERVE** — Read `Drafts.md` (the draft under test), `VoiceModel.md` (the voice fingerprint),
`ThemeGraph.md` (the themes and their supporting experiences), and `ApplicantModel.md` (who the
applicant is). Read `LessonsLearned` for matching rules.

**ANALYZE** — Run the four consistency checks and locate every divergence:
1. **Voice consistency** — measure the `VoiceModel` fingerprint distance section to section; flag any
   section whose register, rhythm, or vocabulary departs from the established voice (often a sign a
   section was over-polished into genericness).
2. **Theme consistency** — confirm each theme in `ThemeGraph` that the essay commits to actually recurs
   across the draft rather than appearing once; flag themes introduced and dropped, and motifs that
   contradict each other.
3. **Timeline consistency** — extract every temporal marker (dates, ages, "before/after," sequence
   words) and check the ordering; flag any pair that cannot both be true.
4. **Identity consistency** — check that the person on the page matches `ApplicantModel` (stated
   values, background, trajectory); flag a claim or characterization the applicant model does not
   support.

**PLAN** — Choose the **single highest-severity** divergence to write up this loop (timeline
contradictions and identity contradictions outrank voice drift, which outranks a thin theme). One
verdict per loop, located.

**EXECUTE** — Record the verdict in `QualityMetrics.assertions[]`: the check, pass/fail, and on failure
the located diagnostic (which section/markers, which dimension, and a direction for repair).

**VERIFY** — Run the assertions below via `kernel/AssertionEngine`. A verdict with no location is a bug
and blocks UPDATE until located.

**LEARN** — Append a `RevisionHistory` entry for each failure (Issue / Cause / Fix direction / Outcome
pending). If the same inconsistency type recurs ≥2 times, the LearningLayer promotes a lesson.

**UPDATE** — Upsert the verdicts into `QualityMetrics` by stable id (check name + located span).
Recompute `hash`, set `source_hashes` to the current Drafts/VoiceModel/ThemeGraph/ApplicantModel
hashes, update the `EssayState` row, bump `updated`. Hand back to the Orchestrator (failures route to
RevisionLoop).

## Assertions

- `assert voice_consistent()` — one voice throughout; VoiceModel fingerprint variance across sections
  below threshold. On fail, the diagnostic names the section that drifts.
- `assert timeline_consistent()` — no contradictory dates or sequence. On fail, the diagnostic quotes
  the conflicting temporal markers.

(Theme and identity consistency are evaluated here against `ThemeGraph` and `ApplicantModel`; a theme
that does not recur or an identity claim the model does not support is written as a located
`QualityMetrics` verdict and routed to RevisionLoop the same way.)

## Idempotency

Pure evaluation over the artifacts: identical inputs ⇒ identical verdicts and diagnostics. Each verdict
is upserted by stable id, so re-checking an unchanged draft replaces verdicts in place and writes only
`updated`. When the draft or a reference changes, only the checks whose `source_hashes` drifted are
re-evaluated; passing verdicts are preserved.

## Output

```
CONSISTENCY: voice <p|f> · theme <p|f> · timeline <p|f> · identity <p|f>
ASSERTIONS: voice_consistent <p|f> · timeline_consistent <p|f>
TOP FINDING: <check> — <located diagnostic>
NEXT: RevisionLoop (inconsistency to repair) | NarrativeVerifier (clean)
```

## Gotchas

- **Voice drift usually means over-editing, not under-editing.** A section that reads "better" but
  no longer sounds like the applicant is a failure; the fix restores the voice, it does not polish
  further.
- **A theme stated once is not a theme.** Recurrence is the test; surface the drop, don't accept the
  mention.
- **Timeline checks are about contradiction, not chronology.** A non-linear essay is fine; two dates
  that cannot coexist are not.
- **Record verdicts, never rewrite.** This skill gates; RevisionLoop repairs with the ratchet.
- **Every verdict must point at a span.** An unlocated "feels inconsistent" is not actionable and is a
  contract violation.
