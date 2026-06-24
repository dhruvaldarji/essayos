---
artifact: NarrativeModel
essay_id: ""
hash: ""
source_hashes: []          # [ThemeGraph:<hash>, ExperienceGraph:<hash>]
last_skill: ""
updated: ""
spine_theme: null          # the single controlling theme (thm id)
arc_type: ""              # e.g. transformation | quest | overcoming | vocation
---

# NarrativeModel

The chosen story spine: the one controlling theme, the arc that carries it, and the ordered beats
that turn experiences into a narrative. One spine, not many — focus is a quality dimension.

## Arc

stakes: ""
turning_point: null        # exp id of the pivot
resolution: ""
takeaway: ""              # what the reader should believe about the applicant by the end

## Beats

<!-- ordered; upsert by id; each beat realizes one experience in service of the spine -->
| id | order | beat | exp_ref | theme_ref | function (setup|rising|turn|falling|resolution) |
|----|-------|------|---------|-----------|--------------------------------------------------|
<!-- | beat-1 | 1 | "the night I almost missed it" | exp-1 | thm-1 | setup | -->
