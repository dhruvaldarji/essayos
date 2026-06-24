---
schema: NarrativeModel
version: 1.0.0
purpose: The chosen narrative structure and its beats — the shape the essay will take.
machine_readable: true
location: artifacts/<essay_id>/NarrativeModel.md
---

# Schema: NarrativeModel

`NarrativeModel` records the **structure** chosen for the essay and the ordered **beats** that realize
it, with the rationale for the choice. It is downstream of `ThemeGraph` and `MessageMap` and upstream
of `Outline` and `SectionSpecifications`. The opening/closing beats feed `assert opening_resolves()`.

## Front matter

```yaml
---
id: narrative-model
hash: <short content hash>
source_hashes: [ThemeGraph:<hash>, MessageMap:<hash>]
structure: hero_journey | mosaic | framing_device | single_transformation | multiple_vignettes | chronological_growth
updated: <ISO-8601>
---
```

- **structure** ∈ `hero_journey | mosaic | framing_device | single_transformation | multiple_vignettes | chronological_growth`.

## Body structure

```markdown
## Beats
| id | order | beat | purpose | carries_theme | carries_experience |
|----|-------|------|---------|---------------|--------------------|
| beat-1 | 1 | <e.g. cold-open image> | <what this beat does> | theme-1 | exp-1 |
| beat-2 | 2 | <e.g. complication> | ... | theme-1 | exp-4 |
| beat-n | n | <resolution that pays off beat-1> | ... | theme-1 | exp-5 |

## Rationale
<why this structure fits this applicant's strongest theme and message — and why alternatives were
rejected>
```

- **beats** are ordered by `order` and upsert by `id`. The final beat should resolve the first
  (image/idea/question) to satisfy `assert opening_resolves()`.

## Idempotency rules

- Beats upsert by `id` (`beat-N`); `structure` is a single enum value.
- `source_hashes` lists `ThemeGraph` + `MessageMap`; either changing marks this `stale`.

## Example (abbreviated)

```markdown
---
id: narrative-model
hash: bbcc
source_hashes: [ThemeGraph:99aa, MessageMap:ccdd]
structure: framing_device
updated: 2026-06-23T00:18:00Z
---

## Beats
| id | order | beat | purpose | carries_theme | carries_experience |
|----|-------|------|---------|---------------|--------------------|
| beat-1 | 1 | 3am, the phone-translation moment | hook + image | theme-1 | exp-1 |
| beat-2 | 2 | pattern across other moments | build the claim | theme-1 | exp-4 |
| beat-3 | 3 | return to 3am, transformed | resolve the frame | theme-1 | exp-5 |

## Rationale
A framing device lets the opening image recur transformed, paying off theme-1 without listing
accomplishments. Mosaic was rejected as too diffuse for a 750-word limit.
```
