---
skill: TransitionEngine
category: writing
purpose: Improve flow between sections — connective tissue and momentum — so the essay reads as one continuous piece, not stitched parts.
reads: [Drafts, Outline]
writes: [Drafts]
preconditions: [Drafts has >=2 adjacent drafted sections in working/, Outline exists]
postconditions: [every adjacent section boundary reads without a jarring jump; overall quality improved by >= epsilon or the change is rejected]
idempotency_key: upsert each section boundary in Drafts by boundary id + content hash; a smooth boundary is a no-op
asks_questions: false
---

# TransitionEngine (writing)

Sections written independently tend to read as independent. This skill repairs the **seams**: it adds
connective tissue, carries momentum across boundaries, and removes jarring jumps so the essay reads as
one continuous arc. It works one boundary at a time, edits **locally** (only the joining sentences),
and honors the ratchet — accept only when `QualityMetrics.overall` improves by >= `epsilon`, and never
replace `best/` with something worse.

## When to run

Once two or more adjacent sections are drafted, after their content is reasonably stable (typically
after `IncrementalWriter` and `ReflectionEngine`, before/around `ConclusionEngine`). Run once per rough
boundary; re-running on a boundary that already flows is a no-op.

## The Loop

**OBSERVE** — Read `EssayState.md`, `Drafts.md` (`best/` + `working/`), and `Outline.md` (the intended
order and logical relation between sections). Consult `LessonsLearned` for matching rules.

**ANALYZE** — Walk each adjacent boundary in `Outline` order. Score flow: abrupt topic switch, repeated
setup, dropped thread, missing logical/temporal link, momentum loss. Pick the **single** worst
boundary. Use the `Outline` to know what relationship the seam *should* express (cause→effect,
then→now, tension→resolution).

**PLAN** — Plan one localized edit at that one boundary: rework the closing sentence of section A
and/or the opening sentence of section B so the thread carries through. Touch only the seam, never the
bodies.

**EXECUTE** — Make the edit in `working/`. Add genuine connective logic, not filler transition words
("furthermore," "in conclusion"). Preserve voice and the existing meaning of both sections. Do not
introduce new claims (that is `IncrementalWriter`'s job and would need evidence).

**VERIFY** — Re-read the boundary for a clean read; run a redundancy check so the new connective text
did not duplicate setup already present. Score the complete `working/` draft against `best/`.

**LEARN** — Append a `RevisionHistory` entry (Issue = the jarring-jump location, Cause = e.g.
"sections written in isolation share no bridging thread", Fix, Outcome). Promote a `LessonsLearned`
rule on recurrence.

**UPDATE** — Upsert the two touched sections in `Drafts.working/` by id; recompute hashes and
`source_hashes`. **Ratchet:** keep the edit only if the complete `working/` draft beats `best/` by >=
`epsilon`; replace `best/` only then; otherwise revert the seam and leave `best/` intact. Update the
EssayState row, set `next_skill`, bump `updated`.

## Assertions

Calls `assert redundancy_low()` to confirm the added connective text did not repeat setup or restate a
prior beat, and `assert voice_consistent()` to confirm the seam edits did not introduce a tonal drift
at the join. A failure yields a located diagnostic and a localized fix. (Transitions add no new claims,
so claim/evidence assertions are out of scope here.)

## Idempotency

Upsert by boundary id (derived from the two adjacent section ids). On OBSERVE, a boundary that already
reads smoothly and whose `source_hashes` match the two sections' current hashes is skipped. Re-runs on
smooth boundaries are byte-identical modulo `updated`. Accept-only ratchet prevents regression.

## Output

```
BOUNDARY: <sectionA -> sectionB> smoothed
ASSERTIONS: redundancy_low: pass|fail | voice_consistent: pass|fail — <diagnostic>
RATCHET: best <x.xx> -> candidate <x.xx> (accepted | rejected, reverted)
NEXT: <skill>
```

## Gotchas

- **Connect with logic, not transition words.** "Furthermore" is not a bridge. A real transition
  carries the thread of meaning from A into B; a signpost word just labels a gap.
- **Touch only the seam.** Rewriting section bodies to force a transition risks regressing verified
  prose — the ratchet forbids it. Edit the joining sentences and nothing more.
- **Don't smuggle in new claims.** Connective text must not assert anything that needs evidence; that
  belongs to `IncrementalWriter` with a `ClaimEvidenceMap` link.
- **Respect the Outline's intended relationship.** A seam that flows nicely but expresses the wrong
  logical relation between sections is still wrong — match what the Outline says the join should mean.
- **Smoothness without redundancy.** The easiest bad transition restates A at the top of B; run
  `redundancy_low` to catch it.
