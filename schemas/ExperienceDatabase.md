---
schema: ExperienceDatabase
version: 1.0.0
purpose: The raw, elicited experiences — the ground truth from which every claim must be traceable.
machine_readable: true
location: artifacts/<applicant>/ExperienceDatabase.md  (APPLICANT-SCOPED — reusable across essays via EssayState.shared_with)
---

# Schema: ExperienceDatabase

`ExperienceDatabase` is the corpus of raw lived experiences elicited from the applicant during
discovery (e.g. by `GrillMe`). It is the **source of truth for the entire essay**: every claim,
theme, and anecdote downstream must trace to an `id` here (`assert claim_traceable()`). Nothing may be
invented that does not originate in this file. It is **applicant-scoped** and reused across essays.

## Front matter

```yaml
---
id: experience-database          # singleton per applicant
hash: <short content hash>
source_hashes: []                # root artifact — elicited directly, derived from nothing
applicant_scoped: true
updated: <ISO-8601>
---
```

## Body structure

One record per experience. The `raw` narrative is the applicant's own words, lightly cleaned — never
interpreted here (interpretation happens in `ExperienceGraph`). `source` records the provenance: which
interview turn it came from, so the trail back to the applicant is intact.

```markdown
## Experiences

- id: exp-1
  title: <short label>
  raw: |
    <the experience in the applicant's own words, multi-line>
  tags: [<topic>, <setting>, <people>]
  source: <interview turn ref, e.g. "GrillMe turn 4">
  elicited: <ISO-8601>

- id: exp-2
  title: ...
  raw: |
    ...
  tags: [...]
  source: ...
  elicited: ...
```

## Idempotency rules

- Every experience has a stable `id` (`exp-N`); records upsert by `id`, never blind-append.
- `source_hashes: []` — this is a root artifact; it is never derived, only elicited.
- Editing or adding an experience changes `hash`, which cascades staleness to `ExperienceGraph`,
  `ApplicantModel`, and everything below them.
- `raw` is preserved verbatim; if the applicant revises an answer, supersede the record (same `id`,
  new content) rather than deleting — the trail of what was said is part of the record.

## Example (abbreviated)

```markdown
---
id: experience-database
hash: e5f6
source_hashes: []
applicant_scoped: true
updated: 2026-06-23T00:05:00Z
---

## Experiences

- id: exp-1
  title: Night shift with Mr. Alvarez
  raw: |
    A patient came in confused at 3am. Nobody on the floor spoke Spanish.
    I sat with him and used my phone to translate until his daughter arrived.
  tags: [language, ED, patient-advocacy]
  source: GrillMe turn 4
  elicited: 2026-06-23T00:04:00Z
```
