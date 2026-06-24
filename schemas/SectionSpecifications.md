---
schema: SectionSpecifications
version: 1.0.0
purpose: Per-section contract — purpose, evidence (experience ids), emotion, transitions, and takeaway — that writing must satisfy.
machine_readable: true
location: artifacts/<essay_id>/SectionSpecifications.md
---

# Schema: SectionSpecifications

`SectionSpecifications` is the per-section build contract. For each `Outline` section it fixes the
purpose, the **evidence** (specific `ExperienceDatabase`/`ExperienceGraph` ids it may draw on), the
intended emotion, the transitions in/out, and the takeaway. It is the immediate spec the writer
fulfills, and the authority for several assertions: `assert prompt_answered()` maps prompt clauses to
these specs, `assert reflection_present()` checks the takeaway is insight not narration, and
`assert evidence_exists()` checks every claim cites a listed experience.

## Front matter

```yaml
---
id: section-specifications
hash: <short content hash>
source_hashes: [Outline:<hash>, MessageMap:<hash>, ExperienceGraph:<hash>, Requirements:<hash>]
updated: <ISO-8601>
---
```

## Body structure

One record per `Outline` section, keyed by the same `sec-N` id.

```markdown
## Specs

- id: sec-1                         # matches Outline section id
  purpose: <what this section must accomplish>
  evidence: [exp-1]                 # experience ids this section may use
  emotion: <the felt state to produce in the reader>
  transition_in: <how we arrive here from the prior section>
  transition_out: <how we hand off to the next>
  takeaway: <the single reflective point the reader leaves with — insight, not event>
  covers_clauses: [clause-1]        # Requirements prompt clauses this section answers
```

- **evidence** must be non-empty for any section making a claim — empty evidence fails
  `assert evidence_exists()`.
- **takeaway** must be reflective (answers "what did this change in me?") to pass
  `assert reflection_present()`.
- **covers_clauses** is what `assert prompt_answered()` reads to confirm every prompt clause is
  addressed.

## Idempotency rules

- Specs upsert by `id` (= the `Outline` section id).
- `source_hashes` lists `Outline` + `MessageMap` + `ExperienceGraph` + `Requirements`; any change
  marks `stale`. A spec whose section id no longer exists in `Outline` is orphaned and removed on
  reconcile.

## Example (abbreviated)

```markdown
---
id: section-specifications
hash: 1122
source_hashes: [Outline:eeff, MessageMap:ccdd, ExperienceGraph:7788, Requirements:a1b2]
updated: 2026-06-23T00:26:00Z
---

## Specs

- id: sec-1
  purpose: drop the reader into the 3am moment without preamble
  evidence: [exp-1]
  emotion: disorientation, then steadiness
  transition_in: cold open, no setup
  transition_out: zoom out to "this kept happening"
  takeaway: presence is a clinical act
  covers_clauses: [clause-1]
```
