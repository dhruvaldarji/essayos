---
schema: ClaimEvidenceMap
version: 1.0.0
purpose: Anti-fabrication ledger — every claim in the draft mapped to a real source experience, with a traceability verdict.
machine_readable: true
location: artifacts/<essay_id>/ClaimEvidenceMap.md
---

# Schema: ClaimEvidenceMap

`ClaimEvidenceMap` is the anti-fabrication infrastructure. Maintained by `meta/ClaimEvidenceMapper`,
it maps every claim made in the `Drafts` back to a real `ExperienceDatabase` id and records whether
the link is genuine. It is the backing store for two assertions: `assert claim_traceable(claim)` (the
claim links to a real, non-fabricated experience) and `assert evidence_exists(claim)` (every asserted
virtue is *shown* by a specific experience). A claim with no real source experience is a fabrication
and blocks submission.

## Front matter

```yaml
---
id: claim-evidence-map
hash: <short content hash>
source_hashes: [Drafts:<hash>, ExperienceDatabase:<hash>]
updated: <ISO-8601>
---
```

## Body structure

One entry per claim found in the draft.

```markdown
## Entries

- id: claim-1                     # stable id for the claim
  claim: <the verbatim or paraphrased claim made in the draft>
  section: sec-2                  # where the claim appears (Outline section id)
  source_experience: exp-4       # the ExperienceDatabase id that grounds it; null if none
  traceable: true | false        # false ⇒ no real source ⇒ fabrication ⇒ blocks submission
```

- **source_experience** must reference a real `ExperienceDatabase` id. `null` ⇒ `traceable: false`.
- **traceable: false** is a hard failure: `assert claim_traceable()` fails and the diagnostic names
  the untraceable claim; the writer must either source it to a real experience or remove it.
- This is the single guardrail against the model inventing accomplishments the applicant never had.

## Idempotency rules

- Entries upsert by claim `id` (`claim-N`).
- `source_hashes: [Drafts:<hash>, ExperienceDatabase:<hash>]`; if the draft changes, claims are
  re-extracted; if the experience database changes, traceability is re-evaluated → `stale` otherwise.
- Re-running the mapper on an unchanged draft yields identical entries (modulo `updated`).

## Example (abbreviated)

```markdown
---
id: claim-evidence-map
hash: ccff
source_hashes: [Drafts:5566, ExperienceDatabase:e5f6]
updated: 2026-06-23T00:42:00Z
---

## Entries

- id: claim-1
  claim: I refuse to leave people alone in the hardest moments.
  section: sec-1
  source_experience: exp-1
  traceable: true

- id: claim-2
  claim: I led a hospital-wide quality initiative.
  section: sec-2
  source_experience: null
  traceable: false
```
