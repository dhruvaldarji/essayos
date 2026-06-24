---
skill: Counterfactuals
category: meta
purpose: Explore alternate narrative framings and structures for the essay to test that the chosen one is genuinely the strongest, not merely the first that occurred.
reads: [EssayState, NarrativeModel, MessageMap, ThemeGraph, ExperienceGraph, ProgramFitModel]
writes: [ReviewerFeedback]
preconditions: [NarrativeModel exists, MessageMap exists, ExperienceGraph exists]
postconditions: [ReviewerFeedback holds a counterfactual block: ≥2 alternate framings scored against the chosen one, with the verdict (keep | switch) and rationale]
idempotency_key: each alternate framing upserted by stable id (framing_id); re-run on unchanged NarrativeModel + MessageMap + ExperienceGraph is a no-op
asks_questions: false
---

# Counterfactuals (meta)

The first viable narrative is almost never proven to be the best — it's just the first that worked.
Counterfactuals tests that choice by deliberately constructing the strongest *alternative* framings from
the same real material and scoring them head-to-head against the chosen one. If the chosen framing wins,
the team now has earned confidence instead of an accident of order. If an alternative wins, that is a
high-leverage finding — reframing is cheaper than polishing and moves the ceiling far more. It works only
with experiences the applicant actually has; it reframes, it does not invent. It flags; it never rewrites.

## When to run

Early in Architecture, after `NarrativeArchitecture` proposes a framing but before the draft is built on
it — the cheapest moment to switch. Also on a stall the Orchestrator escalates as "the narrative may be
wrong, not the prose." Re-run when `NarrativeModel`, `MessageMap`, or `ExperienceGraph` changes (new
material can make a previously-weaker framing strongest).

## What varies across a counterfactual

A framing is defined by choices that can each be varied while the underlying experiences stay fixed:

| Lever | Alternatives to try |
|-------|--------------------|
| **Lead experience** | which moment opens and anchors the arc |
| **Through-line theme** | which theme the essay is *actually about* |
| **Arc shape** | challenge→growth, discovery, conviction-tested, quiet-competence |
| **Order** | chronological vs thematic vs framed-flashback |
| **Stakes frame** | what is at risk and for whom |

## The Loop

**OBSERVE** — Read `EssayState.md`, `NarrativeModel.md` (the chosen framing), `MessageMap.md`,
`ThemeGraph.md`, `ExperienceGraph.md` (the real material pool), and `ProgramFitModel.md`. Read
`LessonsLearned` for framings that have or haven't worked for this applicant.

**ANALYZE** — Determine staleness against NarrativeModel + MessageMap + ExperienceGraph. If unchanged, the
prior comparison stands — skip. Otherwise, identify the levers most worth varying given the new material.

**PLAN** — Construct the next alternate framing by varying one or more levers from the same evidence. One
alternate per loop; build at least two before scoring (a single alternate is not a comparison).

**EXECUTE** — Specify the alternate framing concretely (lead, through-line, arc, order, stakes), drawing
**only** on real `ExperienceGraph` nodes. Score it against the chosen framing on the same axes the
committee will use — fit, distinctiveness, evidence support, memorability — and record the head-to-head with
a keep-or-switch verdict and rationale.

**VERIFY** — Run the assertions below via `kernel/AssertionEngine`. Every alternate must be buildable from
real evidence and answer the prompt; a framing that requires invented material or drops a prompt clause is
rejected.

**LEARN** — Append a `RevisionHistory` entry recording the comparison and verdict (Issue / Cause / Fix
direction / Outcome pending). If a switch is recommended, that is a major lesson — note why the original
under-performed.

**UPDATE** — Upsert each alternate framing and the verdict into the `ReviewerFeedback` counterfactual block
by stable id (framing_id). Recompute `hash`, set `source_hashes`, update the `EssayState` row, bump
`updated`. On a switch verdict, the Orchestrator routes back to `NarrativeArchitecture`.

## Assertions

- `assert prompt_answered()` — every alternate framing must still answer every prompt clause to be a valid
  contender. On fail, the diagnostic names the clause the alternate drops.
- `assert theme_supported(theme)` — an alternate's through-line theme must have ≥2 real experiences. On
  fail, the diagnostic names the unsupported theme.
- `assert evidence_exists(claim)` — every claim a framing relies on must trace to a real experience. On
  fail, the diagnostic lists the claims with no backing.

## Idempotency

Each alternate framing is upserted by stable id; re-running on unchanged material reproduces the same
alternates and the same verdict, writing only `updated`. When material changes, alternates are
reconstructed and may yield a new winner. Identical inputs ⇒ identical counterfactual block.

## Output

```
COUNTERFACTUALS: <n> alternate framings built and scored
CHOSEN: <current framing> — score <x.xx>
BEST ALTERNATE: <framing> — score <x.xx>
VERDICT: KEEP (chosen wins) | SWITCH to <framing> (delta <x.xx>)
ASSERTIONS: prompt_answered <p|f> · theme_supported <p|f> · evidence_exists <p|f>
NEXT: NarrativeArchitecture (adopt switch) | Architecture continues (keep confirmed)
```

## Gotchas

- **Reframe from real material only.** A counterfactual that requires an experience the applicant doesn't
  have is not a contender — it's fiction. Vary the framing, never the facts.
- **Build at least two alternates.** One alternate is an opinion; a field of them is a comparison. A weak
  alternate exists to confirm the chosen framing, not to lose on purpose.
- **Run it before the draft, when it's cheap.** Switching framings after a full draft wastes the writing;
  this skill earns the most by running early in Architecture.
- **A confirmed "keep" is a real win.** Proving the chosen framing beats the alternatives buys earned
  confidence — don't treat a no-switch outcome as wasted work.
- **Flag, never write the draft.** The output is scored framings; `NarrativeArchitecture` adopts the winner.
