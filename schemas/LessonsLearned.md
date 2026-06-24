---
schema: LessonsLearned
version: 1.0.0
purpose: Cross-cutting rules promoted from recurring revisions — the active guardrails that prevent repeat mistakes.
machine_readable: true
location: artifacts/<essay_id>/LessonsLearned.md
---

# Schema: LessonsLearned

`LessonsLearned` turns the passive `RevisionHistory` log into active guardrails. When the same cause
recurs (≥2 occurrences), `kernel/LearningLayer` promotes it to a lesson: a `rule` keyed to a `trigger`
that future writing/review skills consult **before** acting. Its entry shape matches
`kernel/LearningLayer.md` exactly. A lesson with one piece of evidence is premature.

## Front matter

```yaml
---
id: lessons-learned
hash: <short content hash>
source_hashes: [RevisionHistory:<hash>]
updated: <ISO-8601>
---
```

## Body structure

Entries match `LearningLayer` verbatim — `id, pattern, trigger, rule, evidence`:

```markdown
## Entries

- id: lesson-003
  pattern: <the recurring failure>
  trigger: <when it tends to happen>
  rule: <what to do to prevent it>
  evidence: [rev-0004, rev-0007]   # the RevisionHistory ids that motivated it (≥2)
```

- **evidence** must list **≥2** `RevisionHistory` ids — a single occurrence is not yet a lesson.
- Before a writing/review skill changes a draft, it scans here for any `rule` whose `trigger` matches
  the current situation and applies it (active guardrail).

## Idempotency rules

- Entries upsert by `id` (`lesson-N`); a new motivating revision appends to `evidence`, it does not
  create a duplicate lesson.
- `source_hashes: [RevisionHistory:<hash>]`; when history changes, lessons may be re-derived.
- Never delete; supersede.

## Example (abbreviated)

```markdown
---
id: lessons-learned
hash: aabb
source_hashes: [RevisionHistory:88aa]
updated: 2026-06-23T00:40:00Z
---

## Entries

- id: lesson-003
  pattern: sections list cases instead of building a single claim
  trigger: a section carries more than one supporting experience
  rule: pick one representative scene per section; cite others only in passing
  evidence: [rev-0004, rev-0007]
```
