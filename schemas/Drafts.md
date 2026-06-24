---
schema: Drafts
version: 1.0.0
purpose: The draft store and home of the monotonic ratchet — best/ holds the highest-scoring complete draft, working/ holds candidates.
machine_readable: true
location: artifacts/<essay_id>/Drafts.md
---

# Schema: Drafts

`Drafts` is where the actual prose lives and **where the ratchet lives**. It separates `best/` (the
single highest-scoring complete draft — the accept-only champion) from `working/` (candidate drafts
and in-progress sections). The ratchet (see `kernel/Orchestrator.md`, `review/RevisionLoop.md`) scores
every candidate against `best` and never replaces `best` with something worse; an accepted revision
must beat it by at least `epsilon` (`assert monotonic_improvement()`).

## Front matter

```yaml
---
id: drafts
hash: <short content hash>
source_hashes: [SectionSpecifications:<hash>, VoiceModel:<hash>, MessageMap:<hash>]
best_score: <float|null>          # QualityMetrics.overall of the current best draft
best_draft_id: <draft id|null>    # which draft in best/ is champion
epsilon: 0.02                     # mirrors EssayState.epsilon; min improvement to accept
updated: <ISO-8601>
---
```

## Body structure

Two zones. Each draft has a stable `id` and `hash`; each section within a draft has a `sec-N` id (from
`Outline`) and its own `hash` so a single section can be revised and re-scored in isolation.

```markdown
## best/
- draft_id: draft-3
  score: 0.81                      # = best_score
  complete: true
  sections:
    - id: sec-1
      hash: aa01
      content: |
        <prose>
    - id: sec-2
      hash: aa02
      content: |
        <prose>

## working/
- draft_id: draft-4
  score: 0.79                      # candidate; below best ⇒ NOT promoted
  complete: false
  derived_from: draft-3
  sections:
    - id: sec-1
      hash: bb01
      content: |
        <candidate prose for sec-1 only>
```

- **best/** holds at most one complete champion draft; its `score` equals `best_score`.
- **working/** holds candidates. A candidate is promoted to `best/` only if `score ≥ best_score + ε`
  (`assert monotonic_improvement()`); otherwise it is rejected and retained for the record.
- Per-section `hash` enables localized revision: change one section, re-score, compare — never blanket
  rewrites (the diagnostic-driven, localized-fix rule).

## Idempotency rules

- Drafts upsert by `draft_id`; sections within a draft upsert by `sec-N` id.
- `source_hashes` lists `SectionSpecifications` + `VoiceModel` + `MessageMap`; any change marks `stale`.
- Re-running the writer on unchanged specs yields a byte-identical candidate (modulo `updated`).
- `best/` is **append-superseding**: a worse draft never overwrites the champion.

## Example (abbreviated)

```markdown
---
id: drafts
hash: 5566
source_hashes: [SectionSpecifications:1122, VoiceModel:3344, MessageMap:ccdd]
best_score: 0.81
best_draft_id: draft-3
epsilon: 0.02
updated: 2026-06-23T00:30:00Z
---

## best/
- draft_id: draft-3
  score: 0.81
  complete: true
  sections:
    - id: sec-1
      hash: aa01
      content: |
        It was 3am and nobody on the floor spoke his language. So I stayed.
```
