---
schema: Outline
version: 1.0.0
purpose: The section skeleton — ordered nodes, each with a job and what message/story it carries. NO prose.
machine_readable: true
location: artifacts/<essay_id>/Outline.md
---

# Schema: Outline

`Outline` is the structural skeleton: an ordered list of section nodes, each declaring its **job** and
what it **carries** (which message and story). It contains **no prose** — prose lives in `Drafts`.
It realizes the `NarrativeModel` beats and is the parent of `SectionSpecifications`. The set of
section ids here is the authority for what sections exist; `assert prompt_answered()` ultimately maps
prompt clauses to these sections.

## Front matter

```yaml
---
id: outline
hash: <short content hash>
source_hashes: [NarrativeModel:<hash>, MessageMap:<hash>]
updated: <ISO-8601>
---
```

## Body structure

```markdown
## Sections
| id | order | job | carries_message | carries_story | carries_beat |
|----|-------|-----|-----------------|---------------|--------------|
| sec-1 | 1 | <what this section accomplishes structurally> | <core or supporting msg> | story-1 | beat-1 |
| sec-2 | 2 | ... | ... | story-2 | beat-2 |
```

- **No prose.** Each row is a structural declaration only — job + what it carries. Sentences here are
  a schema violation.
- **id** values (`sec-N`) are referenced by `SectionSpecifications`, `Drafts`, `Requirements`
  prompt-clause `covered_by`, and section-scoped assertions.

## Idempotency rules

- Section nodes upsert by `id` (`sec-N`); ordering by `order`.
- `source_hashes` lists `NarrativeModel` + `MessageMap`; either changing marks `stale`.
- Removing a section id orphans its `SectionSpecifications`/`Drafts` rows — those go `stale` and must
  be reconciled.

## Example (abbreviated)

```markdown
---
id: outline
hash: eeff
source_hashes: [NarrativeModel:bbcc, MessageMap:ccdd]
updated: 2026-06-23T00:24:00Z
---

## Sections
| id | order | job | carries_message | carries_story | carries_beat |
|----|-------|-----|-----------------|---------------|--------------|
| sec-1 | 1 | open on the 3am image | core_message | story-1 | beat-1 |
| sec-2 | 2 | establish the pattern across cases | core_message | story-2 | beat-2 |
| sec-3 | 3 | return to 3am, resolved | core_message | story-1 | beat-3 |
```
