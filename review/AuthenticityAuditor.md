---
skill: AuthenticityAuditor
category: review
purpose: Verify every virtue is demonstrated not stated, humility is preserved, emotion is earned, and the prose carries no cliché, exaggeration, or performative vulnerability.
reads: [Drafts, VoiceModel, ClaimEvidenceMap]
writes: [ReviewerFeedback]
preconditions: [Drafts has a complete working draft, VoiceModel exists, ClaimEvidenceMap exists]
postconditions: [ReviewerFeedback has an authenticity verdict per flagged span with a located, repairable diagnostic]
idempotency_key: findings upserted by stable id (hash of section + offending span); re-run on unchanged Drafts + VoiceModel + ClaimEvidenceMap is a no-op
asks_questions: false
---

# AuthenticityAuditor (review)

The conscience of the essay. It reads the draft the way a sharp reader does and asks one question of
every line: is this *earned*, or is it being *claimed*? A virtue named is worthless; a virtue shown by
a specific scene is the whole game. This skill is also the cliché and performance filter — it is where
"I learned the true meaning of compassion" gets caught and sent back. It flags; it does not rewrite.
Repair is the RevisionLoop's job, guided by the diagnostics written here.

## When to run

First review step, once a complete working draft exists, and any time `Drafts` changes after a
revision round. Also re-run when `VoiceModel` or `ClaimEvidenceMap` changes — a new voice fingerprint
or a broken claim→evidence link can turn a previously-clean line into a flagged one.

## The Loop

**OBSERVE** — Read `Drafts.md` (the working draft), `VoiceModel.md` (the applicant's fingerprint), and
`ClaimEvidenceMap.md` (claim → ExperienceGraph id links). Read `LessonsLearned` for any authenticity
rule whose trigger matches this draft.

**ANALYZE** — Pass over the draft for the five failure modes, in order:
1. **Stated, not demonstrated.** Every virtue/quality adjective ("compassionate," "resilient,"
   "driven") must trace through `ClaimEvidenceMap` to a real experience. A claim with no backing scene
   is a tell.
2. **Humility lost.** Scan for self-congratulation, savior framing, and credit-taking that the scene
   does not support. Preserved humility reads as the applicant being one actor among many.
3. **Emotion not earned.** Flag emotional language that the surrounding scene has not built to — a
   "tears in my eyes" that arrives with no specific, prior detail to ground it.
4. **Exaggeration.** Superlatives and stakes inflation the evidence does not carry ("changed my life
   forever," "the most important moment of my existence").
5. **Cliché and performative vulnerability.** Application-essay stock phrases, and the manufactured
   confession that exists to look brave rather than to be true.

**PLAN** — Choose the **single highest-severity** offending span to write up. One finding per loop,
located precisely. Stated-but-unevidenced virtues outrank tone problems; tone problems outrank lone
clichés.

**EXECUTE** — Write the finding into `ReviewerFeedback`: the section id, the verbatim offending span,
which of the five failure modes it is, why it fails, and a *direction* for repair (not the rewrite
itself — e.g. "replace the claim 'I am compassionate' with the night-shift scene at exp-night-shift-code
that already demonstrates it").

**VERIFY** — Run the assertions below via `kernel/AssertionEngine`. A failed assertion is itself the
finding's evidence; it blocks UPDATE only if the engine cannot produce a located diagnostic.

**LEARN** — Append a `RevisionHistory` entry (Issue = the diagnostic / Cause = root cause, e.g. "the
section spec asked for a trait, not a scene" / Fix = the direction given / Outcome = pending). If the
same failure mode has now fired ≥2 times, the LearningLayer promotes a `LessonsLearned` rule.

**UPDATE** — Upsert the finding into `ReviewerFeedback` by stable id (hash of section + span). Recompute
the artifact `hash`, set `source_hashes` to the current Drafts/VoiceModel/ClaimEvidenceMap hashes,
update the `EssayState` row, bump `updated`. Hand back to the Orchestrator.

## Assertions

- `assert authenticity_preserved()` — no cliché, no exaggeration, no performative vulnerability, and the
  VoiceModel fingerprint distance stays below threshold. On fail, the diagnostic quotes the offending
  line and names which dimension broke.
- `assert evidence_exists(claim)` — every asserted virtue is *shown* by a specific experience. On fail,
  the diagnostic lists the claims with no backing scene.
- `assert claim_traceable(claim)` — each claim links through `ClaimEvidenceMap` to a real
  `ExperienceDatabase` id and is non-fabricated. On fail, the diagnostic names the untraceable claim.

## Idempotency

Pure evaluation over the draft. Each finding is upserted by a stable id (hash of section + offending
span), so re-auditing an unchanged draft replaces findings in place and adds nothing. A re-run over
unchanged `Drafts` + `VoiceModel` + `ClaimEvidenceMap` produces a byte-identical `ReviewerFeedback`
(modulo `updated`). When the draft changes, only findings whose spans changed are re-evaluated;
resolved findings are marked resolved, never deleted.

## Output

```
AUDIT: <k> spans flagged across <n> sections
ASSERTIONS: authenticity_preserved <p|f> · evidence_exists <p|f> · claim_traceable <p|f>
TOP FINDING: <section> — "<span>" — <failure mode>
NEXT: RevisionLoop (findings to repair) | CommitteeReview (clean)
```

## Gotchas

- **Flag, never fix.** This skill writes diagnostics; the RevisionLoop makes the localized change.
  Rewriting here bypasses the ratchet and risks regressing a good section.
- **An adjective with no scene is the canonical failure.** "Compassionate" is not authenticity; the
  specific room where it was shown is. Send the claim back to its evidence.
- **Earned emotion is built, not announced.** If the scene did not earn the feeling, the fix is more
  specific scene, not softer feeling-words.
- **Do not invent a cliché list at runtime.** Use a fixed, stable list so verdicts are reproducible;
  a line that passed yesterday must pass today on the same inputs.
- **Humility is structural, not a hedge.** Adding "I was lucky" does not fix savior framing; restoring
  the other people in the scene does.
