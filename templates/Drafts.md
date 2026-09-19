---
artifact: Drafts
essay_id: ""
hash: ""
source_hashes: []          # [SectionSpecifications:<hash>, VoiceModel:<hash>]
last_skill: ""
updated: ""
best_score: null           # QualityMetrics.overall of the draft in best/
best_version: null         # version id currently held in best/
working_version: null      # version id currently in working/
version_count: 0
origin: composed           # composed | ingested
self_authored: null        # ingest only: true if the applicant wrote the ingested text without AI help
ingested_hash: null        # ingest only: hash of draft-ingested at ingest time; never changes
---

# Drafts

Holds the essay text under the best-draft ratchet. `best/` is the highest-scoring COMPLETE draft so
far; `working/` is the in-progress candidate. Candidates are scored against `best/`, never the live
`working/` copy. `best/` is replaced only by a strictly higher score (see kernel/Orchestrator ratchet).

## ingested/

<!-- ingest mode only. The applicant's original essay, verbatim, write-once. Never edited in place. -->
<!--
draft_id: draft-ingested
origin: ingested
sections:
  - { id: sec-1, hash: "", text: "" }
full_text: ""
-->

## best/

<!-- the highest-scoring complete draft. Replaced only on a higher QualityMetrics.overall. -->
<!--
version: ""
score: null
sections:
  - { id: sec-1, text: "" }
full_text: ""
-->

## working/

<!-- the in-progress candidate; IncrementalWriter / RevisionLoop mutate here, then score vs best/ -->
<!--
version: ""
sections:
  - { id: sec-1, text: "" }
full_text: ""
-->
