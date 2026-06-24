---
artifact: ReviewerFeedback
essay_id: ""
hash: ""
source_hashes: []          # [Drafts:<hash>]  (feedback targets a specific draft version)
last_skill: ""
updated: ""
target_version: null       # the Drafts version this feedback applies to
feedback_count: 0
---

# ReviewerFeedback

Findings from the review specialists (AuthenticityAuditor, CommitteeReview, Skeptic, ProgramDirector,
CopyEditor, ...). Each item is actionable and tied to a specific draft version and location, so
RevisionLoop can apply and close it by id.

## Feedback

<!-- upsert by id; status closes when a revision addresses it -->
| id | reviewer | severity (block|major|minor|nit) | location (sec id) | finding | suggested_fix | target_version | status |
|----|----------|----------------------------------|-------------------|---------|---------------|----------------|--------|
<!-- | fb-1 | Skeptic | major | sec-2 | "claim of leadership has no evidence" | cite exp-5 or cut | v3 | open | -->
