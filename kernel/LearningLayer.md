---
skill: LearningLayer
category: kernel
purpose: Maintain RevisionHistory and LessonsLearned so the system stops repeating mistakes.
reads: [RevisionHistory, LessonsLearned, QualityMetrics]
writes: [RevisionHistory, LessonsLearned]
preconditions: [EssayState exists]
postconditions: [every fix has an Issue/Cause/Fix/Outcome record; recurring issues become lessons]
idempotency_key: identical events upsert the same record, never duplicate
asks_questions: false
---

# LearningLayer (kernel)

The memory of the system. Every revision, every assertion failure, every dead end is recorded so the
same mistake is not made twice within a run — or across runs of the same applicant's essays.

## When to run

Invoked by other skills at their LEARN step. Also run directly to review what has been learned, or to
promote recurring within-essay issues into reusable `LessonsLearned`.

## The Loop

**OBSERVE** — Read `RevisionHistory.md` and `LessonsLearned.md`.

**ANALYZE** — For the incoming event, classify: is it a one-off fix, or the Nth occurrence of a
pattern already in history?

**PLAN** — One-off → a `RevisionHistory` entry. Recurring (≥2 occurrences of the same cause) → also a
`LessonsLearned` entry that future skills must consult.

**EXECUTE / UPDATE** — Upsert the records.

### RevisionHistory entry (the durable unit)

```yaml
- id: rev-0007
  ts: <ISO-8601>
  section: <section id or "global">
  issue: <what was wrong — usually a verbatim assertion diagnostic>
  cause: <root cause, not the symptom — why was it wrong?>
  fix: <the localized change made>
  outcome: <quality delta + which assertions now pass>
  by: <skill or specialist that made the fix>
```

### LessonsLearned entry (the cross-cutting rule)

```yaml
- id: lesson-003
  pattern: <the recurring failure>
  trigger: <when it tends to happen>
  rule: <what to do to prevent it>
  evidence: [rev-0004, rev-0007]   # the revisions that motivated it
```

## Preventing recurrence

Before a writing/review skill makes a change, it consults `LessonsLearned` for any `rule` whose
`trigger` matches the current situation, and applies it. This turns the history from a passive log
into an active guardrail (the same move that makes a good engineering org learn from incidents).

## Humans (the applicant) are never the root cause

If the applicant gave a thin answer, the cause is "the interview question was too broad," not "the
applicant didn't try." Causes point at the *process*, which is the only thing the OS can change.

## Idempotency

Events carry a derivable id (e.g. hash of section+issue). Re-recording the same event updates the
existing entry rather than adding a duplicate.

## Output

```
RECORDED: rev-<n> (<one-line issue>)
LESSON:   lesson-<n> promoted | none
```

## Gotchas

- **Cause must be the root cause, not the symptom.** "Reflection missing" is the issue; "the section
  spec didn't require a reflective takeaway" is the cause. Fix causes upstream when possible.
- **A lesson with one piece of evidence is premature.** Require ≥2 occurrences before promoting.
- **Never delete history.** Supersede with a new entry; the trail is the value.
