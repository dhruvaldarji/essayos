---
schema: Requirements
version: 1.0.0
purpose: The essay's fixed constraints — prompt, type, limits, program, audience, and the prompt clauses every section must answer to.
machine_readable: true
location: artifacts/<essay_id>/Requirements.md
---

# Schema: Requirements

`Requirements` is the contract the essay must satisfy. It is set at `init` from the applicant's task
and is the authority for `assert word_budget()` and `assert prompt_answered()`. Every other artifact
is downstream of it: if the prompt or limit changes, everything derived becomes `stale`.

The single most important field is `prompt_clauses` — the prompt decomposed into atomic, separately
answerable demands. `assert prompt_answered()` maps each clause to ≥1 section in
`SectionSpecifications`; a clause with no covering section is a hard failure.

## Front matter

```yaml
---
id: requirements                 # singleton; one per essay
hash: <short content hash>
source_hashes: []                # root artifact; derived from nothing
prompt: <verbatim essay prompt>
essay_type: residency | fellowship | personal_statement | diversity | adversity | leadership | specialty | why_program
word_limit: <int|null>           # null if char-limited
char_limit: <int|null>           # null if word-limited
program: <target program/specialty, or null for a generic statement>
audience: <who reads this — e.g. "IM residency admissions committee">
updated: <ISO-8601>
---
```

## Body structure

```markdown
## Hard constraints
- <non-negotiable rule, e.g. "no more than 750 words">
- <e.g. "must name the program by name at least once">

## Prompt clauses
| id | clause | required | covered_by |
|----|--------|----------|------------|
| clause-1 | "Why do you want to pursue Internal Medicine" | true | <section id\|null> |
| clause-2 | "what makes you a strong fit" | true | <section id\|null> |

## Notes
<free-form context about the program/audience that shapes tone or content>
```

- **prompt_clauses** are upsert-by-`id`. `covered_by` is filled by the architecture phase and read by
  `assert prompt_answered()`.
- **hard constraints** are checked by `assert word_budget()` and surfaced to every writing skill.

## Idempotency rules

- Singleton `id: requirements`; clause rows upsert by clause `id`.
- `hash` covers prompt + limits + clauses; `source_hashes: []` (root artifact).
- Changing the prompt or any limit changes `hash`, which marks every downstream artifact `stale`.

## Example (abbreviated)

```markdown
---
id: requirements
hash: a1b2
source_hashes: []
prompt: "Why do you want to pursue Internal Medicine, and what makes you a strong fit?"
essay_type: residency
word_limit: 750
char_limit: null
program: Internal Medicine
audience: IM residency admissions committee
updated: 2026-06-23T00:00:00Z
---

## Hard constraints
- ≤ 750 words
- name the specialty explicitly

## Prompt clauses
| id | clause | required | covered_by |
|----|--------|----------|------------|
| clause-1 | "Why do you want to pursue Internal Medicine" | true | sec-2 |
| clause-2 | "what makes you a strong fit" | true | sec-3 |
```
