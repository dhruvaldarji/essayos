---
artifact: ExperienceDatabase
scope: applicant            # applicant-scoped; reusable across essays via shared_with
essay_id: ""
hash: ""
source_hashes: []
last_skill: ""
updated: ""
count: 0
---

# ExperienceDatabase

The applicant's real, lived experiences — the *only* source of truth for the essay. Nothing is
invented here; every record is elicited from the applicant. Downstream artifacts may only reference
experiences that exist in this database.

## Experiences

<!-- upsert by id; one record per concrete experience. STAR-ish, but factual, not yet narrated -->
| id | title | when | role | situation | action | result | reflection | sensory_detail | tags |
|----|-------|------|------|-----------|--------|--------|------------|----------------|------|
<!-- | exp-1 | "first code as intern" | PGY-1 | sub-I | overnight admit | escalated early | caught sepsis | learned to trust unease | beeping monitor, cold hallway | [resilience, clinical] | -->
