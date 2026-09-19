---
artifact: IngestReport
essay_id: ""
hash: ""
source_hashes: []          # [Drafts:<hash>, ReviewerFeedback:<hash>, ClaimEvidenceMap:<hash>, VoiceModel:<hash>, QualityMetrics:<hash>]
last_skill: ""             # maintained by review/PersonalizationReview; seeded by system/Ingest
updated: ""
ingested_draft_id: null
self_authored: null
ai_tells_strong: 0
ai_tells_weak: 0
untraceable_claims: 0
monotone_sections: 0
suggestions_open: 0
suggestions_accepted: 0
suggestions_rejected: 0
---

# IngestReport

Only used in `mode: ingest`. The applicant-facing view of the review of an essay they brought in.
Derived from ReviewerFeedback, ClaimEvidenceMap, VoiceModel, and QualityMetrics. Regenerable at any
time; holds no state of its own.

## Verdict

<!-- three to five plain sentences: what reads as AI, what reads as the applicant, what is unproven -->

## Passages

<!-- upsert by passage (section id); verdict in keep|revise|ground; decision mirrors ReviewerFeedback -->
| passage | verdict | why | suggestion | decision |
|---------|---------|-----|------------|----------|
<!-- | sec-2 | ground | claims "leadership" with no scene behind it | sug-3 | proposed | -->

## Next question

<!-- the one interview question that would most improve the essay, or "none" -->
