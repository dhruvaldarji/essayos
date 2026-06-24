---
schema: ProgramFitModel
version: 1.0.0
purpose: The past→current→future arc of the applicant against the target program — and the gaps that remain.
machine_readable: true
location: artifacts/<essay_id>/ProgramFitModel.md
---

# Schema: ProgramFitModel

`ProgramFitModel` models how the applicant fits the specific `program` in `Requirements`. It frames
the arc — who they were, who they are, the physician they intend to become — and maps it to what this
program offers, surfacing `fit_gaps` (claimed fit with no backing experience) so writing does not
overreach. It draws on `ApplicantModel` + `ExperienceGraph` and is read by `MessageMap` and
`assert prompt_answered()` for "why this program" clauses.

## Front matter

```yaml
---
id: program-fit-model
hash: <short content hash>
source_hashes: [ApplicantModel:<hash>, ExperienceGraph:<hash>, Requirements:<hash>]
program: <target program/specialty, mirrors Requirements.program>
updated: <ISO-8601>
---
```

## Body structure

```markdown
## Past self
| id | statement | evidence |
|----|-----------|----------|
| past-1 | <who they were before> | [exp-1] |

## Current self
| id | statement | evidence |
|----|-----------|----------|
| cur-1 | <who they are now> | [exp-4] |

## Future physician
| id | statement | evidence |
|----|-----------|----------|
| futp-1 | <the doctor they will be> | [exp-5] |

## Program fit
| id | program_offering | applicant_match | evidence |
|----|------------------|-----------------|----------|
| fit-1 | <what the program provides> | <how it matches the applicant> | [exp-4] |

## Fit gaps
| id | claimed_fit | gap | resolution |
|----|-------------|-----|------------|
| gap-1 | <a fit asserted without backing> | <what evidence is missing> | <elicit exp / drop claim> |
```

- **fit_gaps** is the anti-overreach ledger: any `program_fit` row with no `evidence` becomes a gap to
  resolve (elicit a real experience or drop the claim) before writing leans on it.

## Idempotency rules

- All sub-records upsert by `id` (past-, cur-, futp-, fit-, gap-).
- `source_hashes` lists `ApplicantModel` + `ExperienceGraph` + `Requirements`; any change marks
  `stale`. Changing `Requirements.program` invalidates the whole model.

## Example (abbreviated)

```markdown
---
id: program-fit-model
hash: ddee
source_hashes: [ApplicantModel:c3d4, ExperienceGraph:7788, Requirements:a1b2]
program: Internal Medicine
updated: 2026-06-23T00:20:00Z
---

## Program fit
| id | program_offering | applicant_match | evidence |
|----|------------------|-----------------|----------|
| fit-1 | continuity clinic model | wants long-arc patient relationships | [exp-5] |

## Fit gaps
| id | claimed_fit | gap | resolution |
|----|-------------|-----|------------|
| gap-1 | strong research alignment | no research experience elicited | elicit or drop |
```
