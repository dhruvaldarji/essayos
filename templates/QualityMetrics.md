---
artifact: QualityMetrics
essay_id: ""
hash: ""
source_hashes: []          # [Drafts:<hash>]  (metrics score a specific draft version)
last_skill: ""
updated: ""
target_version: null       # the Drafts version these metrics score
# the 7 quality dimensions (0–1 each), null until first scored
authenticity: null
specificity: null
reflection: null
voice: null
flow: null
memorability: null
program_fit: null
# rollups
overall: null              # weighted aggregate of the 7 dimensions
ceiling: null              # max achievable given the evidence captured so far
threshold: 0.85            # the applicant's bar (mirrors EssayState.quality_threshold)
ready_for_submission: false
---

# QualityMetrics

Scores the current best draft on the seven dimensions, rolls them into `overall`, and tracks the
`ceiling` (what the captured evidence can support) against the `threshold` (the applicant's bar).
The Orchestrator's ratchet reads `overall` and `ceiling` from here.

## Dimensions

| dimension | score | notes |
|-----------|-------|-------|
| authenticity | | |
| specificity | | |
| reflection | | |
| voice | | |
| flow | | |
| memorability | | |
| program_fit | | |

## Assertions

<!-- the named assertions (kernel/AssertionEngine) that gate submission; each must pass -->
| id | assertion | result (pass|fail|untested) | diagnostic |
|----|-----------|-----------------------------|------------|
<!-- | as-1 | theme_supported | untested | | -->
<!-- | as-2 | reflection_present | untested | | -->
<!-- | as-3 | evidence_exists | untested | | -->

## Submission gate

ready_for_submission: false   # true only when overall >= threshold AND all assertions pass AND FinalReviewer says YES
