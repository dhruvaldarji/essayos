---
skill: GrillMe
category: discovery
purpose: Adaptive one-question-at-a-time interview that elicits raw lived experience and writes it to ExperienceDatabase.
reads: [EssayState, Requirements]
writes: [ExperienceDatabase]
preconditions: [EssayState exists, Requirements exists]
postconditions: [ExperienceDatabase has >=1 raw experience per required coverage area, last question's information gain < gain_floor]
idempotency_key: each experience upserted by stable id; an answered question is never re-asked; re-run on unchanged ExperienceDatabase + Requirements is a no-op
asks_questions: true
---

# GrillMe (discovery)

The interviewer. It pulls lived experience **out of the applicant** one question at a time, drilling
into the thinnest or most surprising part of the last answer. It is grounded in two evidence-based
techniques: **retrieval practice** (effortful recall surfaces detail that recognition never does) and
the **cognitive interview** (open-ended, follow-the-thread, reinstate context — the protocol forensic
interviewers use to recover specifics). GrillMe is the **only** source of raw experiences. It elicits;
it never invents. If the applicant did not say it, it does not go in `ExperienceDatabase`.

## When to run

First substantive step of Discovery, and any time `ExperienceDatabase` is `missing` or `thin`, or a
coverage area below is empty. Resumable: it reads what is already on disk and continues from the gap,
never re-asking an answered question.

## The Loop

**OBSERVE** — Read `EssayState.md`, `Requirements.md`, and the existing `ExperienceDatabase.md`. Build
the coverage map: which of the required areas already have at least one grounded experience and which
are empty or thin. Coverage areas this skill must drive toward (none skipped):

- **childhood memories** — formative early scenes, family, origin of an interest
- **motivations** — why medicine, why now, the specific moment it became real
- **mentors** — people who shaped them; what was modeled, said, or done
- **failures** — a concrete miss, what broke, what they owned
- **patient encounters** — a specific person, a specific room, what happened
- **leadership** — a time they carried responsibility for an outcome or a group
- **adversity** — a real obstacle (not a humble-brag), how it actually went
- **growth** — a before/after where they changed
- **aspirations** — the physician they intend to become

**ANALYZE** — Find the highest-value gap. Priority: (1) an empty required area; (2) a thin area
(present but one vague line, no scene); (3) the **thinnest or most surprising part of the last
answer** — the place the applicant glossed, contradicted, or lit up. Compass: "would the answer to my
next question change a downstream artifact (a theme, a claim, a section)?" If yes, there is gain.

**PLAN** — Choose **exactly one** question. Cognitive-interview shape: open-ended, context-reinstating,
specific to what was just said. Good: "You said the night shift 'changed something' — walk me through
the moment you noticed it changing. Where were you, who was in the room?" Bad: a list, a leading
question, or a fresh-script question that ignores the last answer.

**EXECUTE** — Ask the one question via `ask_question()` (CONVENTIONS §5). Wait for the answer. Nothing
more — never batch, never preview the next three questions.

**VERIFY** — Before writing, run the assertions below against the captured answer. The bar is low and
honest: is there an actual experience here (a specific time/place/person/action), or only an adjective
or a generality? `assert evidence_exists` fails on "I'm compassionate" with no scene behind it; on
failure, the repair is a drill-down follow-up, not fabrication.

**LEARN** — Append a `RevisionHistory` entry (Issue / Cause / Fix / Outcome) for any answer that
failed an assertion and was re-drilled. If the applicant revealed a reusable interviewing insight
(e.g. "they only open up about failures when asked about a specific date"), append to `LessonsLearned`.

**UPDATE** — Upsert the experience into `ExperienceDatabase` by stable `id` (slug of the scene, e.g.
`exp-night-shift-code`). Store it **raw and attributed to the applicant** — verbatim-faithful, with the
coverage area(s) it serves and a one-line provenance ("applicant, Q14"). Recompute the artifact `hash`,
set `EssayState` row `last_skill: GrillMe`, bump `updated`. After UPDATE, reassess information gain; if
gain across all remaining areas is `< gain_floor`, set `next_skill: ApplicantModel` and stop.

## Assertions

- `assert evidence_exists(experience)` — the captured answer is a *shown* experience (specific
  time/place/person/action), not a bare adjective or generality. On fail, drill in; do not record a
  label as if it were evidence.

## Idempotency

Each experience is upserted by stable `id` (scene slug) with a content `hash`; re-capturing the same
scene replaces, never duplicates. Answered questions are tracked so they are never re-asked. A re-run
over an unchanged `ExperienceDatabase` + `Requirements` asks no new question and writes nothing but
the `updated` timestamp. If `Requirements` changes (new prompt clause needs a new area), only the
newly-uncovered area is interviewed; existing experiences are preserved.

## Output

```
COVERAGE: <k>/9 areas grounded
ASKED: Q<n> — "<the one question>"
CAPTURED: exp-<slug> (<area>) — evidence_exists: pass|fail
GAIN: <est. info gain of next question> vs gain_floor <x.xx>
NEXT: GrillMe (gain >= floor) | ApplicantModel (gain < floor)
```

## Gotchas

- **One question. Always.** A list of questions is a contract violation, not a shortcut.
- **The applicant is the only source of truth.** Never write an experience the applicant did not give
  you. No composite scenes, no "they probably also...". Elicit it or leave the area thin.
- **Drill the surprise, not the script.** The highest-value question is almost always a follow-up into
  the thinnest/most-surprising part of the last answer — that is where unrecorded detail lives.
- **An adjective is not an experience.** "Resilient" is a claim for later; capture the *scene* that
  would prove it, or capture nothing.
- **Stop when gain dies.** Past `gain_floor`, more questions extract noise and fatigue the applicant.
  Hand back to the Orchestrator; do not pad coverage with low-value questions.
