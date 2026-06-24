---
schema: ApplicantModel
version: 1.0.0
purpose: A durable model of who the applicant is — values, strengths, identity, motivations, and future-physician self.
machine_readable: true
location: artifacts/<applicant>/ApplicantModel.md  (APPLICANT-SCOPED — reusable across essays via EssayState.shared_with)
---

# Schema: ApplicantModel

`ApplicantModel` is the synthesized portrait of the applicant, distilled from the
`ExperienceDatabase`. It is **applicant-scoped**, not essay-scoped: a second essay reuses it via
`EssayState.shared_with` rather than re-interviewing. It feeds `ProgramFitModel`, `MessageMap`, and
`assert evidence_exists()` (every asserted virtue must be *shown* by an experience, never just stated
here).

## Front matter

```yaml
---
id: applicant-model              # singleton per applicant
hash: <short content hash>
source_hashes: [ExperienceDatabase:<hash>]   # derived from elicited experiences
applicant_scoped: true
updated: <ISO-8601>
---
```

## Body structure

Each record carries a stable `id` and links back to `ExperienceDatabase` ids that ground it — so a
claim here is always traceable (anti-fabrication; see `ClaimEvidenceMap`).

```markdown
## Values
| id | value | evidence |
|----|-------|----------|
| val-1 | <a value the applicant lives by> | [exp-3, exp-7] |

## Strengths
| id | strength | evidence |
|----|----------|----------|
| str-1 | <a demonstrated strength, not a self-label> | [exp-2] |

## Identity
| id | facet | description | evidence |
|----|-------|-------------|----------|
| idn-1 | <e.g. first-gen, caregiver, immigrant> | <how it shapes them> | [exp-1] |

## Motivations
| id | motivation | description | evidence |
|----|-----------|-------------|----------|
| mot-1 | <what drives them toward medicine> | <text> | [exp-4] |

## Future physician
| id | dimension | statement | evidence |
|----|-----------|-----------|----------|
| fut-1 | <e.g. patient relationship, scope of practice> | <the doctor they intend to be> | [exp-5] |
```

## Idempotency rules

- Singleton `id: applicant-model`; every sub-record (val-, str-, idn-, mot-, fut-) upserts by its own
  `id`.
- `source_hashes` lists the `ExperienceDatabase` hash; if experiences change, this model goes `stale`.
- A record with an empty `evidence` list fails `assert evidence_exists()` — claims must be shown.

## Example (abbreviated)

```markdown
---
id: applicant-model
hash: c3d4
source_hashes: [ExperienceDatabase:e5f6]
applicant_scoped: true
updated: 2026-06-23T00:10:00Z
---

## Values
| id | value | evidence |
|----|-------|----------|
| val-1 | meets people where they are | [exp-3, exp-7] |

## Strengths
| id | strength | evidence |
|----|----------|----------|
| str-1 | stays calm and clear under acute pressure | [exp-2] |

## Future physician
| id | dimension | statement | evidence |
|----|-----------|-----------|----------|
| fut-1 | patient relationship | wants continuity, not episodic care | [exp-5] |
```
