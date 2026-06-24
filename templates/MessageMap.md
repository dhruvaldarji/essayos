---
artifact: MessageMap
essay_id: ""
hash: ""
source_hashes: []          # [NarrativeModel:<hash>, ProgramFitModel:<hash>, Requirements:<hash>]
last_skill: ""
updated: ""
controlling_message: ""    # the single sentence the whole essay must land
---

# MessageMap

The argument layer: the one controlling message, the supporting messages that build it, and the
evidence each rests on. Every `must_address` requirement maps to a message here; every message maps
to real evidence. This is the bridge between narrative and outline.

## Messages

<!-- upsert by id; supports_requirement links back to Requirements decoded asks -->
| id | message | supports_requirement | evidence (exp/theme ids) | order | weight |
|----|---------|----------------------|--------------------------|-------|--------|
<!-- | msg-1 | "I chose IM for the diagnostic breadth" | req-1 | [exp-2, thm-1] | 1 | high | -->
