---
skill: Resume
category: system
purpose: Reconstruct an essay's state purely from artifacts/<essay_id>/ on disk, repair the registry to match reality, and route to the Orchestrator.
reads: [EssayState, Requirements, ApplicantModel, ExperienceDatabase, ExperienceGraph, ThemeGraph, NarrativeModel, ProgramFitModel, MessageMap, Outline, SectionSpecifications, VoiceModel, Drafts, ReviewerFeedback, RevisionHistory, QualityMetrics, LessonsLearned, ClaimEvidenceMap]
writes: [EssayState]
preconditions: [artifacts/<essay_id>/ exists with at least EssayState.md]
postconditions: [EssayState registry reflects on-disk reality, hashes recomputed, staleness recomputed, phase inferred, next_skill set to Orchestrator]
idempotency_key: re-running on an unchanged on-disk tree recomputes identical hashes/statuses -> byte-identical EssayState (modulo updated)
asks_questions: false
---

# Resume (system)

Resume is the proof of the "restartable from disk" invariant (CONVENTIONS §4). It assumes nothing
from conversation: it reads every artifact file under `artifacts/<essay_id>/`, derives the true state,
reconciles the EssayState registry to match what is actually on disk, and hands off to the
Orchestrator. After Resume, the system continues exactly where it left off.

## When to run

After any interruption — a new session, a crashed run, a hand-edited file, or simply picking the
essay back up later. Run it first; then run the Orchestrator. Safe anytime; it only repairs the
registry to match disk.

## The Loop

**OBSERVE** — Read `artifacts/<essay_id>/EssayState.md`. Then read every artifact file present in the
directory (the full `reads:` set), ignoring conversation memory entirely. Compute each artifact's
current content hash from its body on disk.

**ANALYZE** — For each tracked artifact:
- If the file is absent -> `missing`.
- If present but below postconditions (empty body / count 0 / only template comments) -> `thin`.
- Recompute `source_hashes` against the current upstream hashes; if any recorded source hash no longer
  matches -> `stale`.
- Else -> `ok`.
Infer `phase` from the furthest-progressed healthy artifact along the canonical pipeline
(Requirements -> discovery -> architecture -> writing -> review -> verification). Read
`QualityMetrics` for `overall`/`ceiling`/`ready_for_submission`. Detect drift: registry status or
hashes that disagree with disk (e.g. a hand-edited artifact).

**PLAN** — The unit of work is "reconcile the registry to disk." No essay content is generated.

**EXECUTE** — Upsert each registry row to its recomputed `status`, `hash`, and `source_hashes`. Set
`EssayState.phase` to the inferred phase, mirror `quality_overall`/`quality_ceiling` from
QualityMetrics, and set `converged` only if QualityMetrics says `ready_for_submission` and
FinalReviewer recorded YES.

**VERIFY** — Assert every registry row matches the file it points at (status and hash). Assert that
the inferred phase is consistent with the healthy artifacts (no "writing" phase with a missing
Outline, etc.). A failed assertion blocks UPDATE and is reported as drift.

**LEARN** — If reconciliation changed any status (drift detected), append a Resume entry to
`RevisionHistory` noting what disagreed and how it was reconciled.

**UPDATE** — Bump `EssayState.updated`, set `next_skill: Orchestrator`, and hand off. The Orchestrator
then selects the next real skill from the now-accurate state.

## Assertions

- `assert reconstructable()` — state was rebuilt from files alone, with no reliance on conversation.
- `assert registry_matches_disk()` — every row's status and hash equal the recomputed on-disk values.
- `assert phase_consistent()` — inferred phase is supported by the set of healthy artifacts.

## Idempotency

Resume is a pure function of the on-disk tree. Running it twice on an unchanged directory recomputes
identical hashes and statuses, yielding a byte-identical `EssayState.md` except for `updated`. It
never duplicates work and never fabricates content — it only mirrors reality into the registry.

## Output

```
RESUME: <essay_id>
RECONSTRUCTED FROM DISK: <n artifacts read>
RECONCILED: <n ok> / <n thin> / <n missing> / <n stale>   DRIFT: <n rows corrected>
PHASE (inferred): <phase>   QUALITY: overall <x.xx|–> / ceiling <x.xx|–>   READY: <yes|no>
NEXT: Orchestrator — resume from the highest-value gap
```

## Gotchas

- **Disk is the only truth.** Never trust conversation, prior-run memory, or the existing registry's
  recorded status over what the files actually contain. The whole point is reconstruction from disk.
- **Reconcile, don't regenerate.** Resume repairs the registry; it never writes essay content. If an
  artifact is thin or stale, mark it — let the Orchestrator route the right skill to fix it.
- **Honor staleness on resume.** A hand-edited upstream artifact must mark downstream `stale` here, or
  the Orchestrator will bake the old value into later work (CONVENTIONS §3).
- **Do not set converged casually.** `converged: true` requires QualityMetrics `ready_for_submission`
  AND a recorded FinalReviewer YES — never infer it from phase alone.
