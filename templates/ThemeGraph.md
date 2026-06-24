---
artifact: ThemeGraph
essay_id: ""
hash: ""
source_hashes: []          # [ExperienceGraph:<hash>, ApplicantModel:<hash>]
last_skill: ""
updated: ""
theme_count: 0
---

# ThemeGraph

Candidate themes discovered across the experience graph — the recurring meanings that several
experiences share. Each theme must be supported by 2+ experiences (asserted by
`assert theme_supported()`). Architecture selects the essay's spine from here.

## Themes

<!-- upsert by id; supporting_exps must be 2+ for a theme to be usable -->
| id | theme | statement | supporting_exps | strength | program_relevance |
|----|-------|-----------|-----------------|----------|-------------------|
<!-- | thm-1 | resilience | "growth through early clinical failure" | [exp-1, exp-4] | 0.8 | high | -->

## Theme edges

<!-- relationships between themes: reinforces | tensions-with | subsumes -->
<!-- | id | from | to | relation | -->
<!-- | te-1 | thm-1 | thm-2 | reinforces | -->
