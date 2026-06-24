---
skill: ReflectionEngine
category: writing
purpose: Raise meaning density — turn description into insight, accomplishment into growth, abstraction into specificity — without fabricating.
reads: [Drafts, ExperienceGraph, SectionSpecifications]
writes: [Drafts]
preconditions: [Drafts has at least one drafted section in working/, ExperienceGraph exists]
postconditions: [each targeted section carries a genuine reflective turn grounded in a real experience; overall quality improved by >= epsilon or the change is rejected]
idempotency_key: upsert each section in Drafts by section id + content hash; a section already carrying sufficient reflection is a no-op
asks_questions: false
---

# ReflectionEngine (writing)

Most weak essays describe; strong ones reflect. This skill increases **meaning density**: it converts
event-narration into "what this changed in me," accomplishment into growth, and abstraction into the
specific. It works one section at a time, makes **localized** edits, and honors the ratchet — every
accepted change must raise `QualityMetrics.overall` by >= `epsilon`, and `best/` is never replaced by
something worse. The added reflection must be true to a real experience, never manufactured depth.

## When to run

After at least one section is drafted, and whenever a section reads as description-heavy or
accomplishment-listing. Typically alternated with `IncrementalWriter` and before
`TransitionEngine`/`ConclusionEngine`. Re-running on a section that already carries sufficient
reflection is a no-op.

## The Loop

**OBSERVE** — Read `EssayState.md`, `Drafts.md` (`best/` + `working/`), `ExperienceGraph.md`,
`SectionSpecifications.md`. Consult `LessonsLearned` for matching rules.

**ANALYZE** — Score each section's meaning density: ratio of description-only sentences to reflective
ones; presence of a "what changed in me" turn; specificity vs abstraction; growth vs accomplishment.
Pick the **single** lowest-density section that the spec says should reflect. Find, in `ExperienceGraph`,
the real consequence/insight nodes attached to that section's experience — these are the only legal
raw material for added reflection.

**PLAN** — Plan one localized edit to that one section: which description sentence becomes a reflective
turn, which abstraction becomes concrete, sourced to a specific `ExperienceGraph` node. Do not touch
other sections.

**EXECUTE** — Make the edit in `working/`. Convert description → insight, accomplishment → growth,
abstraction → specificity, drawing only on real experience nodes. Keep the applicant's voice. No
performative vulnerability, no manufactured epiphany, no cliché ("I learned so much," "it taught me to
never give up").

**VERIFY** — Run the assertions below. Score the resulting complete `working/` draft against `best/`.
A failed assertion or a sub-epsilon gain blocks acceptance.

**LEARN** — Append a `RevisionHistory` entry (Issue = density diagnostic, Cause = e.g. "spec asked for
event recap, not takeaway", Fix, Outcome = quality delta). Promote a `LessonsLearned` rule on a
recurring pattern.

**UPDATE** — Upsert the edited section in `Drafts.working/` by id; recompute hashes and `source_hashes`.
**Ratchet (localized, accept-only):** keep the edit only if the complete `working/` draft beats `best/`
by >= `epsilon`; replace `best/` only then; otherwise revert the section and leave `best/` intact.
Update the EssayState row, set `next_skill`, bump `updated`.

## Assertions

Calls `assert reflection_present(section)` on the edited section (it must contain insight/growth, not
just event narration). The added reflection's evidence must trace to a real `ExperienceGraph` node — if
it cannot, the turn is fabricated and the edit is rejected. Diagnostics drive a localized repair, not a
broad rewrite.

## Idempotency

Upsert by section id. On OBSERVE, a section whose meaning density already clears the bar and whose
`source_hashes` match `ExperienceGraph`/`SectionSpecifications` is skipped. Re-runs on unchanged,
sufficiently-reflective sections are byte-identical modulo `updated`. Accept-only ratchet means re-runs
cannot lower quality.

## Output

```
SECTION: <section id> reflection added (density <before> -> <after>)
ASSERTIONS: reflection_present: pass|fail — <diagnostic>
RATCHET: best <x.xx> -> candidate <x.xx> (accepted | rejected, reverted)
NEXT: <skill>
```

## Gotchas

- **Reflection must be earned, not inserted.** Depth sourced to a real `ExperienceGraph` node is
  insight; depth with no source is performative vulnerability — the exact thing
  `authenticity_preserved` rejects.
- **Growth over accomplishment.** "I led the team to a win" is accomplishment; "I learned I default to
  control under pressure, and what that cost the team" is growth — and only if it actually happened.
- **Specificity over abstraction.** Replace "I grew as a person" with the concrete moment that shows
  it. Abstraction is where meaning density goes to die.
- **Localized edits only.** One section per run; the ratchet forbids broad rewrites that could regress
  good sections.
- **No epiphany clichés.** Avoid the tidy lesson-learned bow; real reflection is often partial and
  specific, not resolved and universal.
