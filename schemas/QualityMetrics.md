---
schema: QualityMetrics
version: 1.0.0
purpose: The scorecard — 7 quality dimensions, overall, ceiling, threshold, assertion verdicts, and the submission gate.
machine_readable: true
location: artifacts/<essay_id>/QualityMetrics.md
---

# Schema: QualityMetrics

`QualityMetrics` is the scorecard the ratchet reads and the convergence gate. It holds the 7 quality
dimensions (each 0–1), the `overall`, the achievable `ceiling`, the applicant's `threshold`, the
verdicts of every assertion run by `kernel/AssertionEngine`, and `ready_for_submission`. The
Orchestrator compares `overall` against the best draft for the accept-only ratchet, and against
`threshold`/`ceiling` for the pre-write ceiling gate.

## Front matter

```yaml
---
id: quality-metrics
hash: <short content hash>
source_hashes: [Drafts:<hash>, ReviewerFeedback:<hash>]
scored_draft_id: <draft id this scorecard is for>
updated: <ISO-8601>
---
```

## Body structure

```markdown
## Dimensions
| dimension | score |
|-----------|-------|
| authenticity | <0–1> |
| specificity | <0–1> |
| reflection | <0–1> |
| voice | <0–1> |
| flow | <0–1> |
| memorability | <0–1> |
| program_fit | <0–1> |

## Scores
| field | value |
|-------|-------|
| overall | <0–1> |          # mirrors EssayState.quality_overall
| ceiling | <0–1> |          # max achievable given current evidence; mirrors quality_ceiling
| threshold | <0–1> |        # applicant's bar; mirrors EssayState.quality_threshold

## Assertions
| name | arg | verdict | diagnostic |
|------|-----|---------|------------|
| theme_supported | theme-1 | pass | "" |
| reflection_present | sec-2 | fail | "all sentences are event-narration" |

ready_for_submission: false      # true only when FinalReviewer READY_FOR_SUBMISSION: YES
```

- **dimensions** are exactly the 7: `authenticity, specificity, reflection, voice, flow, memorability,
  program_fit`, each 0–1.
- **assertions[]** mirrors `AssertionEngine` output (`name, arg, verdict, diagnostic`); any `fail`
  blocks the calling skill's UPDATE.
- **ready_for_submission** is the convergence gate — `true` only when `FinalReviewer` records
  `READY_FOR_SUBMISSION: YES` (this is what lets `EssayState.converged` flip to `true`).

## Idempotency rules

- Singleton `id: quality-metrics`; assertion rows upsert by `name`+`arg`.
- Pure evaluation: identical `Drafts`/`ReviewerFeedback` ⇒ identical verdicts (matches AssertionEngine
  idempotency).
- `source_hashes: [Drafts:<hash>, ReviewerFeedback:<hash>]`; either changing marks `stale`.

## Example (abbreviated)

```markdown
---
id: quality-metrics
hash: 9911
source_hashes: [Drafts:5566, ReviewerFeedback:7799]
scored_draft_id: draft-3
updated: 2026-06-23T00:38:00Z
---

## Scores
| field | value |
|-------|-------|
| overall | 0.81 |
| ceiling | 0.88 |
| threshold | 0.85 |

## Assertions
| name | arg | verdict | diagnostic |
|------|-----|---------|------------|
| theme_supported | theme-1 | pass | "" |
| word_budget |  | pass | "" |

ready_for_submission: false
```
