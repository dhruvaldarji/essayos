---
skill: FirstPrinciples
category: meta
purpose: Reduce the essay and its argument to irreducible fundamentals, and challenge inherited "how essays are written" assumptions that may be capping quality.
reads: [EssayState, Requirements, MessageMap, NarrativeModel, ThemeGraph, Drafts]
writes: [ReviewerFeedback]
preconditions: [Requirements exists, MessageMap exists OR a draft exists]
postconditions: [ReviewerFeedback holds a first-principles block classifying each structural choice as fundamental, constraint, or inherited assumption, with the unearned assumptions flagged]
idempotency_key: each classified element upserted by stable id (element + scope); re-run on unchanged Requirements + MessageMap + NarrativeModel is a no-op
asks_questions: false
---

# FirstPrinciples (meta)

Most essay weakness is inherited, not chosen. "Open with a vivid scene," "end with a forward-looking
line," "every paragraph needs a transition" — these are conventions reasoned by analogy to other essays,
not derived from what *this* prompt and *this* applicant actually require. FirstPrinciples strips the
essay down to its irreducible truths — what the prompt genuinely demands, what the applicant genuinely
has, what a reviewer genuinely needs — and rebuilds the structural choices from those alone. Conventions
that survive the strip are kept; conventions that don't are flagged as removable cost. It flags; it never
rewrites.

## When to run

When the Orchestrator stalls and the score is stuck despite clean prose — a sign the *structure* inherited
an assumption that caps the ceiling. Also useful once at the start of Architecture, before
`NarrativeArchitecture` locks the shape, to ensure the chosen form is derived rather than copied. Re-run
when `Requirements`, `MessageMap`, or `NarrativeModel` changes.

## The three-step method

| Step | Obligation |
|------|-----------|
| **DECONSTRUCT** | Break the essay into its actual parts and actual values: what the prompt literally asks, what message must land, which experiences exist, what the reviewer must come away knowing. State each as a fact, not a convention. |
| **CHALLENGE** | Classify every structural element as one of three: **fundamental** (the prompt or the message *requires* it), **constraint** (a real limit — word budget, true timeline, program values), or **inherited assumption** (a convention with no derivation from this essay's facts). Only fundamentals and constraints are immutable; everything else is negotiable. |
| **RECONSTRUCT** | Rebuild the structural choices from fundamentals and constraints alone. Where the rebuilt choice differs from the current draft, that delta is the finding — an inherited assumption to drop or a fundamental currently unmet. |

## The Loop

**OBSERVE** — Read `EssayState.md`, `Requirements.md` (the literal prompt + limits), `MessageMap.md`,
`NarrativeModel.md`, `ThemeGraph.md`, and `Drafts.md` if a draft exists. Read `LessonsLearned` for
assumptions already retired on prior essays.

**ANALYZE** — Determine staleness against Requirements + MessageMap + NarrativeModel. If unchanged, the
deconstruction stands — skip. Otherwise, list the structural choices currently in force.

**PLAN** — Choose the next structural choice to run through the three steps. One choice per loop, starting
with the highest-leverage one (usually the opening or the central arc).

**EXECUTE** — Run DECONSTRUCT → CHALLENGE → RECONSTRUCT on that choice. Produce a classification
(fundamental / constraint / inherited assumption) and, where the reconstruction diverges from the draft,
a located finding with the rebuilt alternative.

**VERIFY** — Run the assertions below via `kernel/AssertionEngine`. A choice cannot be labeled
"fundamental" unless it traces to a prompt clause or a supported theme; an unfounded "fundamental" is
rejected.

**LEARN** — Append a `RevisionHistory` entry for each inherited assumption dropped or fundamental newly
met (Issue / Cause / Fix direction / Outcome pending). A retired assumption that recurs across essays
becomes a `LessonsLearned` rule.

**UPDATE** — Upsert each classified element into the `ReviewerFeedback` first-principles block by stable id
(element + scope). Recompute `hash`, set `source_hashes`, update the `EssayState` row, bump `updated`.

## Assertions

- `assert prompt_answered()` — a choice labeled "fundamental" must trace to a literal prompt clause. On
  fail, the diagnostic names the clause the structure does not actually serve.
- `assert theme_supported(theme)` — a theme treated as load-bearing must have ≥2 experiences. On fail, the
  diagnostic names the theme assumed but unsupported.
- `assert redundancy_low()` — a structural element kept "because essays have it" that adds no meaning is an
  inherited assumption. On fail, the diagnostic quotes the element and its lack of contribution.

## Idempotency

Each classified element is upserted by stable id; re-running on an unchanged element replaces its
classification in place. A re-run over unchanged inputs reclassifies nothing and writes only `updated`.
When inputs change, only affected choices are re-evaluated. Identical inputs ⇒ identical first-principles
block.

## Output

```
FIRST PRINCIPLES: <n> choices examined
FUNDAMENTALS: <n> (prompt/message-required, kept)
CONSTRAINTS: <n> (real limits, kept)
INHERITED ASSUMPTIONS: <n> flagged to drop — <one line each>
UNMET FUNDAMENTAL: <the requirement the structure fails to serve | none>
ASSERTIONS: prompt_answered <p|f> · theme_supported <p|f> · redundancy_low <p|f>
NEXT: NarrativeArchitecture (rebuild structure) | RevisionLoop (drop assumptions)
```

## Gotchas

- **Only physics is immutable — here, only the prompt and the real evidence.** A convention is never a
  fundamental just because every essay uses it. Make it earn the label.
- **Don't burn a fundamental in the name of purity.** The prompt's literal demands and the applicant's real
  constraints are immovable; reconstruction works within them, not around them.
- **Reasoning by analogy is the failure mode you're hunting.** "Strong essays open with a scene" is an
  analogy; "this prompt rewards judgment, so lead with the decision" is a derivation. Demand the latter.
- **Flag, never rewrite.** The output is a classification and a delta; Architecture or the RevisionLoop
  makes the change.
