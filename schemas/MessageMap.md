---
schema: MessageMap
version: 1.0.0
purpose: The single core message, its supporting themes, the story behind each, and the emotional objective per beat.
machine_readable: true
location: artifacts/<essay_id>/MessageMap.md
---

# Schema: MessageMap

`MessageMap` commits to the **one thing** the reader should remember and the machinery that delivers
it: the supporting themes, the story (theme→experience) carrying each, and the emotional objective for
each beat. It is the bridge from discovery to architecture — `Outline` and `SectionSpecifications`
realize it, and `assert evidence_exists()` checks that every supporting theme has a real story behind
it.

## Front matter

```yaml
---
id: message-map
hash: <short content hash>
source_hashes: [ThemeGraph:<hash>, NarrativeModel:<hash>, ProgramFitModel:<hash>]
core_message: <the single sentence the reader keeps>
updated: <ISO-8601>
---
```

## Body structure

```markdown
## Supporting themes
| id | theme | role |
|----|-------|------|
| sup-1 | theme-1 | primary spine |
| sup-2 | theme-3 | reinforcing |

## Stories
| id | theme | experience | what_it_shows |
|----|-------|------------|---------------|
| story-1 | theme-1 | exp-1 | presence as a clinical act |

## Emotional objectives
| id | beat | objective |
|----|------|-----------|
| emo-1 | beat-1 | unsettle, then orient |
| emo-2 | beat-3 | quiet conviction, earned |
```

- **core_message** is exactly one sentence; everything else exists to deliver it.
- **stories** map each supporting theme to a concrete `ExperienceDatabase`/`ExperienceGraph` id — no
  theme may be carried by a story with no experience (fails `assert evidence_exists()`).
- **emotional_objectives** key to `NarrativeModel` beat ids.

## Idempotency rules

- Sub-records upsert by `id` (sup-, story-, emo-).
- `source_hashes` lists `ThemeGraph` + `NarrativeModel` + `ProgramFitModel`; any change marks `stale`.

## Example (abbreviated)

```markdown
---
id: message-map
hash: ccdd
source_hashes: [ThemeGraph:99aa, NarrativeModel:bbcc, ProgramFitModel:ddee]
core_message: I practice medicine by refusing to leave people alone in the hardest moments.
updated: 2026-06-23T00:22:00Z
---

## Supporting themes
| id | theme | role |
|----|-------|------|
| sup-1 | theme-1 | primary spine |

## Stories
| id | theme | experience | what_it_shows |
|----|-------|------------|---------------|
| story-1 | theme-1 | exp-1 | presence as a clinical act |
```
