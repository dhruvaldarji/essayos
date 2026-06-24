---
artifact: ExperienceGraph
essay_id: ""
hash: ""
source_hashes: []          # [ExperienceDatabase:<hash>]
last_skill: ""
updated: ""
node_count: 0
edge_count: 0
---

# ExperienceGraph

Experiences as a graph: nodes are experiences (from `ExperienceDatabase`), edges are relationships
between them (caused, contrasts-with, escalates, recurs, exemplifies). This is what lets Architecture
find arcs and turning points instead of a flat list.

## Nodes

<!-- upsert by id; each node points at an ExperienceDatabase record -->
| id | exp_ref | salience | role_in_arc (setup|turn|payoff|theme) |
|----|---------|----------|----------------------------------------|
<!-- | n-1 | exp-1 | 0.9 | turn | -->

## Edges

<!-- | id | from | to | relation | note | -->
<!-- | e-1 | n-1 | n-2 | caused | early failure drove later mentoring | -->
