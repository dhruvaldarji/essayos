---
artifact: ApplicantModel
scope: applicant            # applicant-scoped; reusable across essays via shared_with
essay_id: ""
hash: ""
source_hashes: []
last_skill: ""
updated: ""
name: ""
identity: []               # who the applicant is, in their own framing
values: []                 # core values, each id'd
motivations: []            # what drives them toward this path
strengths: []
growth_areas: []
defining_moments: []       # pivotal life/career moments (ids point into ExperienceDatabase)
career_goals: []
constraints: []            # things they will not say / do not want surfaced
---

# ApplicantModel

A structured portrait of the applicant, distilled from the GrillMe interview. Applicant-scoped:
a second essay reuses this rather than re-interviewing. Every claim here must trace to an experience
in `ExperienceDatabase` (verified by `meta/ClaimEvidenceMapper`).

## Attributes

<!-- upsert by id; each attribute cites the experiences that ground it -->
| id | kind (value|motivation|strength|growth|goal) | statement | evidence (exp ids) | confidence |
|----|----------------------------------------------|-----------|--------------------|------------|
<!-- | val-1 | value | "patient advocacy over throughput" | [exp-3, exp-7] | high | -->
