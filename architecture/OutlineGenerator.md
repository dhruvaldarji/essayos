---
skill: OutlineGenerator
category: architecture
purpose: Generate a section-level skeleton — each node names its section, its job, and the message/story it carries. No prose.
reads: [EssayState, NarrativeModel, MessageMap]
writes: [Outline]
preconditions: [NarrativeModel is ok, MessageMap is ok]
postconditions: [Outline has one node per section, each with a job and a carried message/story; total nodes fit the word budget; zero prose]
idempotency_key: upsert Outline by essay_id; recompute only if source_hashes of NarrativeModel/MessageMap changed
asks_questions: false
---

# OutlineGenerator (architecture)

Turns the spine and the message contract into a **section-level skeleton** — and nothing more. Each
outline node names a section, states the section's *job*, and binds it to the message beat and the
story it carries. This is the last structural step before `SectionSpecifications` turns each node into
a writer's brief. It produces no sentences.

## When to run

After `MessageMap`, before `SectionSpecifications`. Re-run when `NarrativeModel` or `MessageMap`
changes — the skeleton's node count and ordering follow directly from the beats and emotional arc.

## The Loop

**OBSERVE** — Read `EssayState.md`, `NarrativeModel` (structure + ordered beats + carried
experiences), `MessageMap` (core message, supporting themes, stories, per-beat emotional objectives).
Note `Requirements.word_limit` via the state manifest to size the skeleton.

**ANALYZE** — Determine the section breakdown. Map `NarrativeModel.beats` to sections: usually one
section per beat, but merge thin adjacent beats or split a dense beat when the word budget allows.
Confirm every supporting theme in `MessageMap` has at least one section that carries its story, and
that the opening and closing sections realize the open→close emotional arc.

**PLAN** — Choose the section count that fits `word_limit` (a rough words-per-section budget) and the
single job each section does. Do not draft any section's content.

**EXECUTE** — Write `Outline` as an ordered list of nodes. Each node has: `id`, `section` (a name, not
a sentence — e.g. "Opening hook", "The ordeal", "Resolution"), `job` (what this section must
accomplish for the arc, ≤12 words), `carries_beat` (the `NarrativeModel.beat.id`), `carries_story`
(the `MessageMap` story / experience id), `carries_message` (which supporting theme advances here), and
`approx_words` (a budget share). Mark the opening node's hook and the closing node that resolves it.

**VERIFY** — Run the assertions below via `kernel/AssertionEngine`. A `word_budget` failure (sum of
`approx_words` over or under `Requirements.word_limit`) blocks UPDATE — rebalance section count. A
`prompt_answered` failure means a prompt clause has no owning section — add or reassign a node.

**LEARN** — Append a `RevisionHistory` entry: section count chosen, any beat merges/splits, and why.
If a reusable insight emerged (e.g. "merged two beats; word limit forced a tighter skeleton"), append
to `LessonsLearned`.

**UPDATE** — Upsert `Outline` by `essay_id`. Recompute `hash`; set `source_hashes` to current
`NarrativeModel`, `MessageMap` hashes. Set `EssayState.next_skill: SectionSpecifications`; bump
`EssayState.updated`.

## Assertions

- `assert word_budget()` — the sum of section `approx_words` fits `Requirements.word_limit`; an
  over-budget skeleton guarantees an over-budget draft.
- `assert prompt_answered()` — every clause of the prompt maps to at least one outline section.
- `assert opening_resolves()` — the closing node is bound to pay off the opening node's hook (the
  structural precondition the writer must later realize).

## Idempotency

Upsert `Outline` by `essay_id`. On OBSERVE, if recorded `source_hashes` match current upstream hashes,
no-op — report "no change." Identical inputs produce a byte-identical skeleton (modulo `updated`).
Re-running replaces nodes by `id`; it never appends duplicate sections.

## Output

```
SECTIONS:   <n> nodes, each with a job + carried beat/story
BUDGET:     <sum approx_words> / <word_limit>
ASSERTIONS: <k>/<n> passed
NEXT:       SectionSpecifications
```

## Gotchas

- **MUST NOT generate prose. This is the cardinal rule of this skill.** Every node is a *name*, a
  *job*, and *bindings* — never a sentence, never an opening line, never sample wording. If a node
  contains a quotable clause, it is a bug: strip it back to a job description. Prose belongs only to
  the writing phase (`writing/IncrementalWriter`), gated by `SectionSpecifications`.
- **One section per beat is the default, not a rule.** Merge thin beats and split dense ones, but only
  to serve the word budget — never inflate section count past what `word_limit` can carry.
- **Every prompt clause needs an owning section.** A skeleton that drops a clause produces an essay
  that fails `prompt_answered` downstream — catch it here.
- **Bind, don't describe.** Each node points at a real beat id and story/experience id from upstream
  artifacts; it does not re-explain them. The applicant is the only source of truth.
- **Size to the budget.** `approx_words` is a planning device — its sum must fit `word_limit` so the
  draft starts inside the budget rather than needing a later cut.
