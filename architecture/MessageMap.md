---
skill: MessageMap
category: architecture
purpose: Fix the core message, supporting themes, the stories that carry each theme, and the emotional objective at each beat.
reads: [EssayState, NarrativeModel, ThemeGraph, ProgramFitModel]
writes: [MessageMap]
preconditions: [NarrativeModel is ok, ThemeGraph is ok, ProgramFitModel is ok]
postconditions: [MessageMap has one core_message, supporting_themes each story-backed, and an emotional_objective per narrative beat]
idempotency_key: upsert MessageMap by essay_id; recompute only if source_hashes of NarrativeModel/ThemeGraph/ProgramFitModel changed
asks_questions: false
---

# MessageMap (architecture)

Decides what the essay is *actually about* and how it should *land*. From the chosen spine
(`NarrativeModel`), the meanings (`ThemeGraph`), and the fit argument (`ProgramFitModel`), it fixes a
single **Core Message**, the **Supporting Themes** under it, the **Stories** (which experience carries
which theme), and the **Emotional Objective** at each narrative beat — what the reader should feel
there. This is the contract the writing phase must satisfy.

## When to run

After `ProgramAlignment`, before `OutlineGenerator`. Re-run when the spine, themes, or fit model
change — the core message and its emotional shape depend on all three.

## The Loop

**OBSERVE** — Read `EssayState.md`, `NarrativeModel` (structure + beats + carried experiences),
`ThemeGraph` (themes + support counts), `ProgramFitModel` (aligned values + fit gaps). Note which
themes are strongest and which beats are turning points.

**ANALYZE** — Find the gap:

- **Core Message** — the one sentence the reader should believe after reading. It must subsume the
  strongest theme and answer the prompt; there is exactly one.
- **Supporting Themes** — the 2–4 themes from `ThemeGraph` that serve the core message. Each must be
  `theme_supported` (≥2 experiences) — otherwise it is decoration, not support.
- **Stories** — the explicit map of which experience id carries which theme. Each supporting theme
  gets ≥1 carrying experience; reuse of one experience across themes is allowed but flagged for
  redundancy control.
- **Emotional Objectives** — per `NarrativeModel` beat, the single emotion the reader should feel
  (e.g. "unease" at the ordeal beat, "earned resolve" at the return). The opening beat's objective and
  the closing beat's objective must form a deliberate arc, not a flat line.

**PLAN** — Choose the smallest coherent set: one core message, the minimum themes that carry it, one
carrying story per theme, one emotional objective per beat. Do not write any beat prose.

**EXECUTE** — Write `MessageMap`: `core_message` (one sentence), `supporting_themes[]` (each with
`theme_id` and `carries: [<exp id>...]`), `stories[]` (the theme↔experience assignments), and
`emotional_objectives[]` (one per `NarrativeModel.beat.id`). Carry forward `ProgramFitModel`
alignments so the writer knows which beat also does fit work.

**VERIFY** — Run the assertions below via `kernel/AssertionEngine`. A `theme_supported` failure on a
supporting theme blocks UPDATE — drop the theme or route to Discovery to raise its support. A
`redundancy_low` failure means a story is doing double duty without adding meaning — reassign.

**LEARN** — Append a `RevisionHistory` entry: the core message chosen, themes promoted/dropped, and
why. If a reusable insight emerged (e.g. "two themes collapsed into one — they were the same idea"),
append to `LessonsLearned`.

**UPDATE** — Upsert `MessageMap` by `essay_id`. Recompute `hash`; set `source_hashes` to current
`NarrativeModel`, `ThemeGraph`, `ProgramFitModel` hashes. Set `EssayState.next_skill: OutlineGenerator`;
bump `EssayState.updated`.

## Assertions

- `assert theme_supported(theme)` — every supporting theme is backed by ≥2 distinct experiences.
- `assert redundancy_low()` — no theme/story repeats across beats without adding meaning.
- `assert prompt_answered()` — the core message and supporting themes together address every clause
  of the prompt.

## Idempotency

Upsert `MessageMap` by `essay_id`. On OBSERVE, if recorded `source_hashes` match current upstream
hashes, no-op — report "no change." Identical inputs produce a byte-identical map (modulo `updated`).
Re-running replaces entries by `id`; it never appends a second core message or duplicate stories.

## Output

```
CORE:       <core message, one line>
THEMES:     <n supporting, each story-backed>
STORIES:    <n theme↔experience assignments>
EMOTION:    <k> beats with objectives (open: <x> → close: <y>)
ASSERTIONS: <k>/<n> passed
NEXT:       OutlineGenerator
```

## Gotchas

- **Exactly one core message.** Two competing messages is the most common cause of a diffuse essay;
  if the evidence supports two, pick the one that best answers the prompt and demote the other to a
  supporting theme.
- **A theme without ≥2 stories is decoration.** Drop it or send it back to Discovery — do not let an
  unsupported theme into the writing contract.
- **Emotional objectives are an arc, not a list.** Open and close must intentionally differ;
  `opening_resolves` downstream depends on the close paying off the open.
- **Stories cite real experiences only.** Every story maps to an `ExperienceGraph`/`ExperienceDatabase`
  id. The applicant is the only source of truth.
- **No prose.** This skill maps message → themes → stories → emotions. It does not write the beats.
