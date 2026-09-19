---
schema: IngestReport
version: 1.0.0
purpose: The applicant-facing review of an ingested essay — AI-tell verdict, voice match, untraceable claims, and one row per passage with its suggestion and the applicant's decision.
machine_readable: true
location: artifacts/<essay_id>/IngestReport.md
---

# Schema: IngestReport

`IngestReport` exists only in `mode: ingest`. It is the consolidated, human-readable view over
`ReviewerFeedback`, `ClaimEvidenceMap`, `VoiceModel`, and `QualityMetrics` for an essay the applicant
brought in. `review/PersonalizationReview` maintains it; `system/Ingest` seeds it. It is a **derived
view**: every number and every row is recomputable from the artifacts it lists in `source_hashes`,
so it can be regenerated at any time and never holds state that lives nowhere else. The applicant
reads this file to see what was found and what they decided.

## Front matter

```yaml
---
id: ingest-report                 # singleton per essay
hash: <short content hash>
source_hashes: [Drafts:<hash>, ReviewerFeedback:<hash>, ClaimEvidenceMap:<hash>, VoiceModel:<hash>, QualityMetrics:<hash>]
ingested_draft_id: draft-ingested
self_authored: true | false | null
ai_tells_strong: <int>            # humanizer §1–§5 hits across the ingested draft
ai_tells_weak: <int>              # humanizer §6–§18 hits
untraceable_claims: <int>         # ClaimEvidenceMap rows with traceable: false
monotone_sections: <int>          # sections failing personality_present
suggestions_open: <int>
suggestions_accepted: <int>
suggestions_rejected: <int>
updated: <ISO-8601>
---
```

## Body structure

```markdown
## Verdict
<three to five plain sentences: what reads as AI, what reads as the applicant, what is unproven>

## Passages
| passage | verdict | why | suggestion | decision |
|---------|---------|-----|------------|----------|
| sec-1 | keep | opens on a specific scene in the applicant's own words | | |
| sec-2 | ground | claims "leadership" with no scene behind it | sug-3 | proposed |
| sec-3 | revise | not-X-but-Y contrast, three parallel closers | sug-4 | accepted |

## Next question
<the one interview question that would most improve the essay, or "none">
```

- **verdict** ∈ `keep | revise | ground`. `keep` means the passage is the applicant's and stays.
  `revise` means the passage sounds like a model or is flat, and a voice-preserving rewrite is
  proposed. `ground` means the passage makes a claim with no real experience behind it, and the fix is
  an interview question, never an invented detail.
- **suggestion** is a `ReviewerFeedback` suggestion id; **decision** mirrors its `applicant_decision`.

## Idempotency rules

- Singleton `id: ingest-report`; passage rows upsert by `passage` (section id).
- `source_hashes` lists every artifact it summarizes; any change marks it `stale`, and regenerating
  it from unchanged inputs is byte-identical (modulo `updated`).
- It never holds a decision that is not also in `ReviewerFeedback`; the feedback record is the
  authority, this file is the view.

## Example (abbreviated)

```markdown
---
id: ingest-report
hash: 4a4a
source_hashes: [Drafts:5566, ReviewerFeedback:7799, ClaimEvidenceMap:ccff, VoiceModel:3344, QualityMetrics:9911]
ingested_draft_id: draft-ingested
self_authored: false
ai_tells_strong: 4
ai_tells_weak: 7
untraceable_claims: 2
monotone_sections: 1
suggestions_open: 1
suggestions_accepted: 2
suggestions_rejected: 0
updated: 2026-09-19T10:00:00Z
---

## Verdict
The opening scene is yours and it works. The middle two paragraphs read like a model wrote them:
every paragraph ends on a one-line summary, and "leadership" is claimed twice with no scene. Two
claims have nothing behind them yet.
```
