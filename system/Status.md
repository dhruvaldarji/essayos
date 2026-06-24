---
skill: Status
category: system
purpose: Report the essay's phase, every artifact's status, quality overall vs threshold vs ceiling, and the next skill — read-only.
reads: [EssayState, QualityMetrics]
writes: []
preconditions: [artifacts/<essay_id>/EssayState.md exists]
postconditions: [a status report is emitted; no artifact is mutated]
idempotency_key: read-only — running it any number of times changes nothing on disk
asks_questions: false
---

# Status (system)

A read-only dashboard for one essay. It tells you where the process is, which artifacts are healthy
vs. need work, how close quality is to the bar, and what the Orchestrator would do next. It never
writes.

## When to run

Any time you want a snapshot — before deciding whether to keep going, after an interruption, or to
sanity-check the state without advancing it. Always safe.

## The Loop

**OBSERVE** — Read `artifacts/<essay_id>/EssayState.md`. Read `QualityMetrics.md` if it exists. For
each artifact in the registry, stat the file on disk to confirm presence and compare its current
content hash against the registry's recorded `hash` and `source_hashes`.

**ANALYZE** — Classify every tracked artifact into exactly one bucket:
- `missing` — no file on disk (or registry says missing).
- `thin` — exists but below its skill's postconditions (e.g. count 0, empty body).
- `stale` — a recorded `source_hash` no longer matches the current upstream artifact's hash.
- `ok` — postconditions hold and not stale.
Compute the quality picture from QualityMetrics: `overall` vs `threshold` vs `ceiling`, and whether
`ready_for_submission`.

**PLAN** — Nothing to write; the unit of work is "render the report." Determine what the Orchestrator
*would* pick next (stale-before-new, then earliest missing/thin gap) and surface it as advisory only.

**EXECUTE** — Emit the report (see Output). Do not set `next_skill`; only report what it currently is
and what would likely be chosen.

**VERIFY** — Assert the report covers every artifact in the registry and that counts (ok/thin/missing/
stale) sum to the registry size.

**LEARN** — None (read-only; no RevisionHistory entry, by design).

**UPDATE** — None. Status never mutates state, not even `updated`.

## Assertions

- `assert state_parses()` — EssayState front matter is valid.
- `assert registry_covered()` — every registry artifact is classified exactly once.
- `assert read_only()` — no file under `artifacts/<essay_id>/` was written.

## Idempotency

Trivially idempotent: it writes nothing. Two consecutive runs against unchanged state produce an
identical report.

## Output

```
ESSAY:   <essay_id>  (<essay_type>, <program|generic>)
PHASE:   <init|discovery|architecture|writing|review|verification|done>   STATUS: <in_progress|converged|blocked>
ARTIFACTS: <n ok> / <n thin> / <n missing> / <n stale>
  Requirements .......... ok      ApplicantModel ........ thin
  ExperienceDatabase .... ok      ...                     ...
  (one line per tracked artifact with its bucket)
QUALITY: overall <x.xx|–> / threshold <x.xx> / ceiling <x.xx|–>   READY: <yes|no>
NEXT_SKILL (recorded): <skill|null>
WOULD_PICK (advisory): <skill> — <8-word reason>
```

## Gotchas

- **Read-only, always.** Status must never write — not the registry, not `updated`, not next_skill.
  If you need to advance, run the Orchestrator; Status only observes.
- **Stale is computed, not trusted.** Recompute hashes against disk; do not just echo the registry's
  recorded status, which may be out of date if a file was hand-edited.
- **Advisory next pick is not authoritative.** Only the Orchestrator sets `next_skill`. Status labels
  its suggestion as advisory so callers do not mistake it for a committed decision.
