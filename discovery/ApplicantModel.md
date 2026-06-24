---
skill: ApplicantModel
category: discovery
purpose: Infer the applicant's values, strengths, identity, motivations, and future-physician model from their raw experiences.
reads: [ExperienceDatabase]
writes: [ApplicantModel]
preconditions: [ExperienceDatabase exists and is not thin]
postconditions: [ApplicantModel has values, strengths, identity, motivations, and a future-physician model, each traceable to >=1 ExperienceDatabase id]
idempotency_key: each inference upserted by stable id with source experience ids; source_hashes track ExperienceDatabase; re-run on unchanged input is a no-op
asks_questions: false
---

# ApplicantModel (discovery)

The synthesizer of *who this person is*. It reads the raw experiences and infers the durable model
beneath them: values, strengths, identity, motivations, and the **future physician** they are
becoming. This is the applicant's portrait, not the essay's argument — it is **applicant-scoped and
reusable** across every essay (`shared_with` in EssayState), so a residency statement and a later
fellowship statement draw from one model rather than two interviews. ApplicantModel **infers from
evidence only**; every trait must trace to an experience the applicant actually gave.

## When to run

After `GrillMe` has grounded the coverage areas (ExperienceDatabase not thin), or whenever
`ApplicantModel` is `missing`/`thin`/`stale`. It is stale the moment `ExperienceDatabase`'s hash no
longer matches the recorded `source_hashes` — a new or edited experience can change the portrait.

## The Loop

**OBSERVE** — Read every entry in `ExperienceDatabase.md` and the existing `ApplicantModel.md`.
Capture the current `ExperienceDatabase` hash for provenance.

**ANALYZE** — Find the gap: which model facets are missing, thin, or **stale** (an experience changed
under them). The facets, each derived bottom-up from experiences:

- **values** — what they consistently protected or chose under pressure (read from actions, not
  stated beliefs)
- **strengths** — capabilities repeatedly demonstrated across distinct experiences
- **identity** — how they see themselves and are seen; the through-line across childhood → now
- **motivations** — what actually drives the pursuit of medicine, traced to the moment(s) it formed
- **future-physician model** — the specific clinician this trajectory points toward: posture toward
  patients, toward the team, toward their own limits

**PLAN** — Take the *smallest* next facet that is missing/thin/stale. One facet per unit.

**EXECUTE** — Infer that one facet **only from experiences on disk**. For each inferred trait, attach
the `ExperienceDatabase` id(s) that ground it. A trait with zero backing experiences is not written —
it is a fabrication. Prefer traits supported by **multiple distinct** experiences (a value seen once is
a moment; seen across three scenes it is a value).

**VERIFY** — Run the assertions below. `assert claim_traceable` fails any trait whose backing id does
not exist in `ExperienceDatabase`; `assert evidence_exists` fails any asserted strength/value with no
showing scene. A failed assertion blocks UPDATE — drop the unbacked trait or route back to `GrillMe`
to elicit the missing evidence.

**LEARN** — Append a `RevisionHistory` entry for any trait dropped for lack of evidence (Issue =
"trait X had no backing experience"). If a reusable synthesis pattern emerged, append to
`LessonsLearned`.

**UPDATE** — Upsert each facet into `ApplicantModel` by stable `id` (e.g. `val-patient-advocacy`,
`fut-physician`), each carrying its source experience ids. Recompute `hash`, set `source_hashes:
[exp:<current ExperienceDatabase hash>]`, set the `EssayState` row `last_skill: ApplicantModel`, bump
`updated`. If the model is complete and not stale, set `next_skill: ExperienceGraph`.

## Assertions

- `assert evidence_exists(trait)` — every asserted value/strength is *shown* by a specific experience,
  not stated as a label.
- `assert claim_traceable(trait)` — each trait links to a real `ExperienceDatabase` id; nothing
  inferred is untraceable or fabricated.

## Idempotency

Each facet is upserted by stable `id` with the source experience ids it was derived from. The artifact
records `source_hashes: [exp:<hash>]`; on OBSERVE, if that hash still matches the current
`ExperienceDatabase`, the work is already done — skip and report "no change." If it differs, the model
is stale and the affected facets are recomputed before any downstream skill runs. Identical input
yields a byte-identical model modulo `updated`.

## Output

```
FACETS: values <k> / strengths <k> / identity <ok|thin> / motivations <k> / future-physician <ok|thin>
TRACE: <k>/<n> traits backed by >=1 experience (claim_traceable: pass|fail)
STALE: <recomputed facets, or none>
NEXT: ExperienceGraph (model complete) | GrillMe (evidence gap)
```

## Gotchas

- **Inference, never invention.** Every trait traces to an experience the applicant gave. No
  flattering trait the evidence does not earn.
- **Applicant-scoped, not essay-scoped.** Do not bend the model toward the current prompt — that is
  the architecture phase's job. This portrait is reused across essays; keeping it prompt-neutral is
  what makes reuse safe.
- **A trait seen once is weak.** Prefer traits demonstrated across multiple distinct experiences;
  flag single-scene traits as tentative so downstream skills don't over-rely on them.
- **Stale model poisons everything downstream.** If `ExperienceDatabase` changed, recompute before
  ExperienceGraph/ThemeDiscovery read you.
