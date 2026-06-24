---
artifact: ClaimEvidenceMap
essay_id: ""
hash: ""
source_hashes: []          # [Drafts:<hash>, ExperienceDatabase:<hash>]
last_skill: ""             # maintained by meta/ClaimEvidenceMapper
updated: ""
claim_count: 0
unsupported_count: 0       # must reach 0 before READY_FOR_SUBMISSION
---

# ClaimEvidenceMap

Maintained by `meta/ClaimEvidenceMapper`. Every assertable claim in the draft is mapped to the real
experience that grounds it. A claim with no supporting experience is the failure the whole OS exists
to prevent — `unsupported_count` must be 0 at verification.

## Claims

<!-- upsert by id; one row per claim extracted from the current draft -->
| id | claim | location (sec id) | evidence (exp ids) | supported | note |
|----|-------|-------------------|--------------------|-----------|------|
<!-- | clm-1 | "I led the night float team" | sec-2 | [exp-5] | yes | | -->
<!-- | clm-2 | "I am deeply empathetic" | sec-3 | [] | no | abstract; needs scene or cut | -->
