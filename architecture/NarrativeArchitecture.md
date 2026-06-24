---
skill: NarrativeArchitecture
category: architecture
purpose: Select the narrative structure the applicant's own evidence best supports and record it as the NarrativeModel.
reads: [EssayState, ExperienceGraph, ThemeGraph, ApplicantModel, Requirements]
writes: [NarrativeModel]
preconditions: [ExperienceGraph is ok, ThemeGraph is ok, Requirements is ok]
postconditions: [NarrativeModel.structure is one of the six and is justified by evidence, NarrativeModel.beats names the experiences each beat carries]
idempotency_key: upsert NarrativeModel by essay_id; recompute only if source_hashes of ExperienceGraph/ThemeGraph/ApplicantModel/Requirements changed
asks_questions: false
---

# NarrativeArchitecture (architecture)

Picks the spine. This skill does not invent a story; it reads what the applicant already lived
(`ExperienceGraph`) and what those experiences mean (`ThemeGraph`), then chooses the structure those
facts *best fit*. Structure is selected from the evidence, never defaulted. The output is a
`NarrativeModel`: one structure, its justification, and an ordered set of beats that name which real
experiences carry each beat.

## When to run

After Discovery has produced an `ok` `ExperienceGraph` and `ThemeGraph`, and before `MessageMap`.
Re-run when an upstream artifact changes (Discovery surfaced a new experience, a theme's support
shifted) — the chosen structure may no longer be the best fit.

## The Loop

**OBSERVE** — Read `EssayState.md`, `Requirements`, `ApplicantModel`, `ExperienceGraph`,
`ThemeGraph`. Note each theme's support count and each experience's id, time marker, and emotional
weight. Read `Requirements.prompt` and `word_limit` — a 250-word prompt cannot carry a six-beat Hero
Journey.

**ANALYZE** — Score the six candidate structures against the evidence using the heuristics below.
Each structure has an evidentiary signature; the winner is the one whose signature the experiences
and themes actually match, subject to the word budget.

| Structure | Selection heuristic — choose it when the evidence shows… |
|-----------|----------------------------------------------------------|
| **Hero Journey** | one dominant arc with a clear call → ordeal → return; a single theme supported by ≥3 experiences ordered in time, with a turning-point experience and a changed-self after it. |
| **Single Transformation** | exactly one pivotal experience that splits before/after; high emotional weight on one node, themes that all trace to it. Tighter than Hero Journey — fits short word limits. |
| **Chronological Growth** | steady accumulation over time, no single ordeal; ≥4 experiences with monotonic time markers and an increasing-competence theme, none dominating. |
| **Mosaic** | several roughly-equal experiences that share *one* theme but no causal/temporal order; breadth over a single arc. Use when ≥3 experiences each support the same theme independently. |
| **Multiple Vignettes** | 2–4 vivid, self-contained scenes carrying *different* themes that converge on the message; distinct experiences with distinct themes and little temporal linkage. |
| **Framing Device** | one recurring image/object/setting recurs across otherwise-unlinked experiences; an `ExperienceGraph` motif (a place, a phrase, a repeated act) touches ≥2 nodes and can open and resolve the essay. |

Tie-breakers, in order: (1) prompt fit — the structure that most directly answers
`Requirements.prompt`; (2) word budget — drop multi-beat structures that cannot fit `word_limit`;
(3) theme support — prefer the structure whose carrying theme passes `theme_supported` most strongly.

**PLAN** — Choose exactly one structure and the smallest viable beat set for it (3–6 beats). For each
beat, identify the candidate experience id(s) that carry it. Do not draft beat prose.

**EXECUTE** — Write `NarrativeModel`: the selected `structure`, an `evidence_rationale` citing the
specific experience ids and theme ids that won it (and one line on why the runner-up lost), and the
ordered `beats[]` — each beat with `id`, `job` (what the beat does for the arc), and
`carries_experiences: [<exp id>...]`. Mark the beat that resolves the opening if the structure uses a
hook (Hero Journey, Single Transformation, Framing Device).

**VERIFY** — Run the assertions below via `kernel/AssertionEngine`. A failure blocks UPDATE: if the
carrying theme has <2 supporting experiences, the structure is unsupported — route back to
`discovery/GrillMe` to raise support rather than forcing a thinner structure.

**LEARN** — Append a `RevisionHistory` entry (Issue/Cause/Fix/Outcome): which structure was chosen,
which was the runner-up, and why. If a reusable selection insight emerged (e.g. "this applicant's
evidence is breadth-not-depth → Mosaic over Hero Journey"), append to `LessonsLearned`.

**UPDATE** — Upsert `NarrativeModel` by `essay_id`. Recompute `hash`; set `source_hashes` to the
current hashes of `ExperienceGraph`, `ThemeGraph`, `ApplicantModel`, `Requirements`. Set
`EssayState.next_skill: ProgramAlignment` and bump `EssayState.updated`.

## Assertions

- `assert theme_supported(carrying_theme)` — the theme the chosen structure is built on is backed by
  ≥2 distinct experiences. If it fails, the structure is not evidence-supported.
- `assert prompt_answered()` — the chosen structure's beats can address every clause of the prompt;
  a structure that cannot is the wrong structure.
- `assert timeline_consistent()` — for time-ordered structures (Hero Journey, Single Transformation,
  Chronological Growth) the beats' experience time markers do not contradict.

## Idempotency

Upsert `NarrativeModel` by `essay_id`. On OBSERVE, compare recorded `source_hashes` against current
upstream hashes; if all match, this is a no-op — report "no change" and leave `next_skill` advanced.
Identical inputs yield a byte-identical `NarrativeModel` (modulo `updated`). A re-run never appends a
second structure; it replaces the row.

## Output

```
STRUCTURE: <selected> (runner-up: <name>)
EVIDENCE:  <n experiences, n themes drove the choice>
BEATS:     <k> — each mapped to experience ids
ASSERTIONS: <k>/<n> passed
NEXT:      ProgramAlignment
```

## Gotchas

- **Never default to Hero Journey.** It is the most overused structure and rarely the best fit for a
  short prompt or breadth-heavy evidence. Earn the structure from the evidence every time.
- **The applicant is the only source of truth.** A beat may only name experiences that exist in
  `ExperienceGraph`/`ExperienceDatabase`. Never invent a turning point to complete an arc.
- **A structure your evidence can't support is a Discovery gap, not a writing problem.** Route back to
  `discovery/GrillMe`; do not paper over thin support with prose.
- **Respect the word budget at selection time.** Choosing a six-beat arc for a 250-word prompt
  guarantees a downstream `word_budget` failure — pick the structure that fits.
- **No prose.** This skill emits structure + beat jobs + experience mappings only. Beats are
  described by their job, not written out.
