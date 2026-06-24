---
artifact: ProgramFitModel
essay_id: ""
hash: ""
source_hashes: []          # [Requirements:<hash>, ApplicantModel:<hash>, ThemeGraph:<hash>]
last_skill: ""
updated: ""
program: null
program_known: false       # false for a generic statement
---

# ProgramFitModel

How the applicant's themes and goals align to the specific program / specialty. Maps program
attributes to applicant evidence so "fit" is argued from facts, not flattery. Empty / generic when
`program` is null.

## Program attributes

<!-- what the program values, wants, or is known for -->
| id | attribute | source | -->
<!-- | pa-1 | "strong primary-care mission" | program website | -->

## Alignment

<!-- upsert by id; each row connects a program attribute to applicant evidence -->
| id | program_attr | applicant_evidence (exp/attr ids) | theme_ref | strength | claim |
|----|--------------|-----------------------------------|-----------|----------|-------|
<!-- | fit-1 | pa-1 | [exp-3, val-1] | thm-1 | high | "my advocacy work maps to your mission" | -->
