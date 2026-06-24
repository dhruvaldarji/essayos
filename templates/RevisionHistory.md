---
artifact: RevisionHistory
essay_id: ""
hash: ""
source_hashes: []
last_skill: ""
updated: ""
entry_count: 0
---

# RevisionHistory

The append-keyed log of every meaningful change: the LEARN step of every skill writes here
(Issue / Cause / Fix / Outcome). Also where stalls and ratchet decisions (accepted / rejected) are
recorded, making convergence auditable from disk alone.

## Entries

<!-- upsert by id; chronological. ε-decisions and stalls live here too -->
| id | ts | skill | issue | cause | fix | outcome | score_before | score_after | accepted |
|----|----|-------|-------|-------|-----|---------|--------------|-------------|----------|
<!-- | rev-1 | <ts> | RevisionLoop | "weak hook" | abstract opener | rewrote with exp-1 scene | +0.03 | 0.71 | 0.74 | yes | -->
