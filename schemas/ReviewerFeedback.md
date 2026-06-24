---
schema: ReviewerFeedback
version: 1.0.0
purpose: Structured feedback from each reviewer/specialist — strengths, concerns, memorability, suggestions — upsert by reviewer id.
machine_readable: true
location: artifacts/<essay_id>/ReviewerFeedback.md
---

# Schema: ReviewerFeedback

`ReviewerFeedback` collects the structured assessments from the review phase — each `specialists/`
reviewer (e.g. admissions-committee simulation, authenticity reviewer, line editor) records its read
of the current `best` draft. It is upsert-by-reviewer-id so a reviewer's latest pass replaces its
prior one, never duplicates. The `review/RevisionLoop` consumes its `suggestions` to drive localized
fixes, and `memorability` feeds the `QualityMetrics.memorability` dimension.

## Front matter

```yaml
---
id: reviewer-feedback
hash: <short content hash>
source_hashes: [Drafts:<hash>]
reviewed_draft_id: <draft id the feedback is about>
updated: <ISO-8601>
---
```

## Body structure

One record per reviewer, keyed by a stable reviewer `id`.

```markdown
## Reviewers

- id: reviewer-adcom              # stable per reviewer/specialist
  role: <e.g. admissions-committee sim, authenticity reviewer, line editor>
  reviewed_draft_id: draft-3
  ts: <ISO-8601>
  strengths:
    - <what works, specific and located>
  concerns:
    - <what does not work, with location>
  memorability: <float 0–1>       # how much sticks after one read
  suggestions:
    - id: sug-1
      target_section: sec-2
      change: <a localized, actionable change>
```

- **upsert by reviewer `id`** — re-reviewing replaces that reviewer's record for the named draft.
- **suggestions** carry a `target_section` so fixes stay localized (ratchet discipline).
- **memorability** is a 0–1 proxy feeding `QualityMetrics`.

## Idempotency rules

- Reviewer records upsert by reviewer `id`; suggestions upsert by `id` (`sug-N`) within a reviewer.
- `source_hashes: [Drafts:<hash>]`; if the draft changes, feedback about the old draft is `stale`.

## Example (abbreviated)

```markdown
---
id: reviewer-feedback
hash: 7799
source_hashes: [Drafts:5566]
reviewed_draft_id: draft-3
updated: 2026-06-23T00:34:00Z
---

## Reviewers

- id: reviewer-adcom
  role: admissions-committee sim
  reviewed_draft_id: draft-3
  ts: 2026-06-23T00:34:00Z
  strengths:
    - the 3am cold open earns attention without melodrama
  concerns:
    - sec-2 lists cases instead of building one claim
  memorability: 0.7
  suggestions:
    - id: sug-1
      target_section: sec-2
      change: collapse the case list into a single representative scene
```
