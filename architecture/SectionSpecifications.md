---
skill: SectionSpecifications
category: architecture
purpose: Turn each outline node into a writer's brief — Purpose, Evidence, Emotion, Transition (in/out), Takeaway — that drives the writing phase.
reads: [EssayState, Outline, MessageMap, ProgramFitModel]
writes: [SectionSpecifications]
preconditions: [Outline is ok, MessageMap is ok, ProgramFitModel is ok]
postconditions: [SectionSpecifications has one spec per Outline node, each with purpose/evidence/emotion/transition/takeaway, and every prompt clause maps to a section]
idempotency_key: upsert SectionSpecifications by essay_id; recompute only if source_hashes of Outline/MessageMap/ProgramFitModel changed
asks_questions: false
---

# SectionSpecifications (architecture)

The handoff to writing. For each `Outline` node it produces a precise brief the writer executes
without re-deriving anything: **Purpose**, **Evidence** (which experience ids), **Emotion**,
**Transition** (in and out), and **Takeaway**. These specs are the contract `writing/IncrementalWriter`
fills one section at a time. Crucially, the full set of specs is what `prompt_answered` checks — each
clause of the prompt must map to a section here.

## When to run

Last step of the architecture phase, after `OutlineGenerator`, before the writing phase. Re-run when
`Outline`, `MessageMap`, or `ProgramFitModel` changes — a spec is only valid against the current
skeleton, message contract, and fit argument.

## The Loop

**OBSERVE** — Read `EssayState.md`, `Outline` (ordered nodes + jobs + carried beat/story), `MessageMap`
(core message, supporting themes, stories, per-beat emotional objectives), `ProgramFitModel` (which
beats also do fit work). Read `Requirements.prompt` from the manifest to map clauses to sections.

**ANALYZE** — For each outline node, determine what the writer needs and what is missing:

- **Purpose** — the one thing this section must accomplish (carry its message beat / advance the arc).
- **Evidence** — the specific `ExperienceDatabase`/`ExperienceGraph` experience id(s) this section
  shows, drawn from the node's `carries_story`. Names ids, not descriptions.
- **Emotion** — the reader's target feeling here, inherited from the `MessageMap` emotional objective
  for this beat.
- **Transition** — `in` (how this section connects from the previous) and `out` (the handoff to the
  next), so the writer's `TransitionEngine` has explicit seams to honor.
- **Takeaway** — the single residue the reader carries forward from this section into the next.

Then map every clause of `Requirements.prompt` to the section(s) that own it; an unowned clause is a
gap.

**PLAN** — Produce the smallest complete brief per node — no spec should over-specify wording (that is
the writer's job) or under-specify evidence (that breaks traceability). Do not write section prose.

**EXECUTE** — Write `SectionSpecifications`: one spec per `Outline` node, keyed by the node `id`, each
with `purpose`, `evidence: [<exp id>...]`, `emotion`, `transition: {in, out}`, `takeaway`, and
`answers_prompt_clauses: [<clause id/quote>...]`. Carry `ProgramFitModel` fit assignments onto the
sections that do fit work.

**VERIFY** — Run the assertions below via `kernel/AssertionEngine`. A `prompt_answered` failure (some
prompt clause maps to no section) blocks UPDATE — assign the clause to an existing section or route
back to `OutlineGenerator` to add a node. An `evidence_exists` failure means a spec claims something
with no backing experience — bind real evidence or drop the claim.

**LEARN** — Append a `RevisionHistory` entry: which prompt clauses mapped where, any clause that
forced an outline change, and why. If a reusable insight emerged (e.g. "the 'leadership' clause had no
section — added one"), append to `LessonsLearned`.

**UPDATE** — Upsert `SectionSpecifications` by `essay_id`. Recompute `hash`; set `source_hashes` to
current `Outline`, `MessageMap`, `ProgramFitModel` hashes. Set `EssayState.next_skill: VoiceModel` (or
the first writing skill the Orchestrator selects); bump `EssayState.updated`.

## Assertions

- `assert prompt_answered()` — every clause of `Requirements.prompt` maps to ≥1 section spec; this is
  the primary gate of this skill.
- `assert evidence_exists(spec_claim)` — each section's claimed evidence resolves to a real
  experience id; no spec asserts a quality with no backing experience.
- `assert claim_traceable(spec_claim)` — each evidence binding traces to a real `ExperienceDatabase`
  id; no fabricated evidence enters the writer's brief.

## Idempotency

Upsert `SectionSpecifications` by `essay_id`, specs keyed by `Outline` node `id`. On OBSERVE, if
recorded `source_hashes` match current upstream hashes, no-op — report "no change." Identical inputs
produce a byte-identical spec set (modulo `updated`). Re-running replaces specs by node id; it never
appends duplicate specs for the same section.

## Output

```
SPECS:      <n> section briefs (purpose/evidence/emotion/transition/takeaway each)
PROMPT:     <n>/<n> clauses owned by a section
ASSERTIONS: <k>/<n> passed
NEXT:       VoiceModel
```

## Gotchas

- **`prompt_answered` lives here.** This is the artifact the assertion checks — if a prompt clause has
  no owning section, fix it now; downstream the writer cannot answer a clause it was never briefed on.
- **Evidence is ids, not adjectives.** A spec names experience ids; it never says "shows leadership"
  without binding the experience that proves it. The applicant is the only source of truth — never
  fabricate evidence to complete a brief.
- **Specify the job, not the sentences.** Define purpose, emotion, and takeaway; do not pre-write the
  prose. Over-specified wording strips the writer's voice and invites `voice_consistent` failures.
- **Transitions are explicit seams.** Give every section an `in` and `out` so `TransitionEngine` has
  something concrete to honor; vague transitions produce jump cuts.
- **Keep specs in sync with the skeleton.** A spec must exist for exactly the current `Outline` nodes —
  no orphan specs, no unbriefed sections.
