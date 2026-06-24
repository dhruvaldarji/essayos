---
skill: ClaimEvidenceMapper
category: meta
purpose: Ensure every claim in the draft traces to a real elicited experience — the system's core anti-fabrication infrastructure — by building and maintaining the claim-to-evidence map.
reads: [EssayState, Drafts, ExperienceDatabase, ExperienceGraph, MemoryGraph]
writes: [ClaimEvidenceMap]
preconditions: [Drafts has a working draft, ExperienceDatabase exists]
postconditions: [ClaimEvidenceMap has one entry per claim in the draft, each linked to a real ExperienceDatabase id or flagged UNTRACEABLE]
idempotency_key: each claim entry upserted by stable id (claim span hash); re-run on unchanged Drafts + ExperienceDatabase is a no-op
asks_questions: false
---

# ClaimEvidenceMapper (meta)

This is the load-bearing wall of EssayOS's promise: the OS does not invent a life. Every claim the essay
makes — every asserted virtue, every event, every outcome — must trace to something the applicant actually
told the system in Discovery. ClaimEvidenceMapper walks the draft, extracts each claim, and links it to a
real `ExperienceDatabase` id. A claim with no real backing is flagged **UNTRACEABLE** and becomes the
single highest-priority signal in the system: an untraceable claim is a fabrication, and a fabricated
application essay is a catastrophe, not a quality nit. It maps and flags; it never invents evidence to
close a gap.

## When to run

After any draft is written or revised, before Review and Verification — nothing should reach the committee
with an untraceable claim. Pairs with `assert claim_traceable` and `assert evidence_exists` (this skill
maintains the map both depend on). Re-run when `Drafts` changes (new claims to map) or when
`ExperienceDatabase` changes (a previously-untraceable claim may now have backing, or backing may have been
removed).

## What counts as a claim

| Claim type | Example shape | Needs |
|------------|---------------|-------|
| **Virtue / quality** | "I am resourceful" / "I lead under pressure" | a specific experience that *shows* it |
| **Event** | "I started a free clinic" | the experience in the database |
| **Outcome** | "patient volume doubled" | the outcome as the applicant reported it |
| **Belief / motivation** | "this is why I chose medicine" | the formative experience behind it |

Pure connective or reflective prose that asserts nothing factual is not a claim and is skipped.

## The Loop

**OBSERVE** — Read `EssayState.md`, `Drafts.md` (working draft), `ExperienceDatabase.md` (the only valid
evidence source — the applicant's real, elicited memories), `ExperienceGraph.md`, and `MemoryGraph.md` for
navigation. Read the existing `ClaimEvidenceMap.md` and `LessonsLearned`.

**ANALYZE** — Determine staleness: if the map's `source_hashes` match the current Drafts and
ExperienceDatabase, the mapping is current — skip. Otherwise diff: which claims are new (added in the
draft), which links are now stale (their experience changed or was removed).

**PLAN** — Choose the next batch of unmapped or stale claims to resolve. One section's claims per loop, so
each link is verified deliberately.

**EXECUTE** — Extract each claim in scope and search `ExperienceDatabase` for a real id that genuinely
supports it (via `MemoryGraph`). Record a link with the supporting experience id and the strength of fit.
A claim with no real backing is recorded as **UNTRACEABLE** with its exact span — never paper over the gap
by inventing an experience or stretching an unrelated one.

**VERIFY** — Run the assertions below via `kernel/AssertionEngine`. Every claim must resolve to either a
real link or an explicit UNTRACEABLE flag; an unmapped claim is itself a failure.

**LEARN** — Append a `RevisionHistory` entry for each UNTRACEABLE claim (Issue = untraceable claim, Cause,
Fix direction = elicit-or-cut, Outcome pending). A recurring untraceable pattern (the draft keeps inflating
outcomes) becomes a `LessonsLearned` rule and an anti-fabrication guardrail.

**UPDATE** — Upsert each claim entry into `ClaimEvidenceMap` by stable id (claim span hash). Recompute
`hash`, set `source_hashes`, update the `EssayState` row, bump `updated`. Any UNTRACEABLE entry blocks
progress to Verification until resolved.

## Assertions

- `assert claim_traceable(claim)` — every claim links to a real `ExperienceDatabase` id and is
  non-fabricated. On fail, the diagnostic names the untraceable claim and its span.
- `assert evidence_exists(claim)` — every asserted virtue/quality is *shown* by a specific experience, not
  merely stated. On fail, the diagnostic lists the claims with no backing experience.
- `assert timeline_consistent()` — a claim's implied timing must not contradict its source experience's
  markers. On fail, the diagnostic quotes the conflicting markers.

## Idempotency

Each claim entry is upserted by stable id (claim span hash); re-mapping an unchanged claim against an
unchanged database reproduces the same link in place and writes only `updated`. When the draft changes,
only new/changed claims are mapped; when the database changes, affected links are re-verified (an
UNTRACEABLE claim can become traceable, or a link can go stale). Identical inputs ⇒ identical
ClaimEvidenceMap.

## Output

```
CLAIM-EVIDENCE: <n> claims mapped · <n> linked to real experiences · <n> UNTRACEABLE
UNTRACEABLE (blockers): <one line each — claim span → no backing>
WEAK LINKS: <n> (claim → loosely-fitting experience)
ASSERTIONS: claim_traceable <p|f> · evidence_exists <p|f> · timeline_consistent <p|f>
NEXT: GrillMe (elicit missing evidence) or RevisionLoop (cut untraceable) | Verification (all traceable)
```

## Gotchas

- **UNTRACEABLE is the most serious flag in the system.** A fabricated claim is not a quality nit — it can
  sink the application and the applicant. Never downgrade it; never let it reach the committee.
- **Never close a gap by inventing or stretching evidence.** The fix for an untraceable claim is to elicit
  the real experience (route to GrillMe) or cut the claim — never to manufacture support.
- **Only `ExperienceDatabase` is valid evidence.** The applicant's elicited memories are the sole source of
  truth; do not link a claim to a theme, an inference, or another claim.
- **Reflective prose is not a claim.** Map factual assertions; skip pure connective or interpretive text
  that asserts nothing checkable.
- **Map, don't rewrite.** This skill maintains the map and flags gaps; GrillMe elicits and the RevisionLoop
  cuts.
