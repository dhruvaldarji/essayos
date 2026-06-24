---
skill: Orchestrator
category: kernel
purpose: Read EssayState, find the highest-value gap, select and sequence skills, manage convergence.
reads: [EssayState, QualityMetrics]
writes: [EssayState]
preconditions: [EssayState exists]
postconditions: [EssayState.next_skill is set OR converged is true]
idempotency_key: re-running selects the same next skill given unchanged state
asks_questions: false
---

# Orchestrator (kernel)

The Orchestrator is the scheduler. It never writes essay content. It reads state, decides what should
happen next, routes to one skill, and stops. Running it repeatedly walks the essay from empty to
`READY_FOR_SUBMISSION`. It is the entry point for "what now?".

## When to run

Any time you are unsure what to do next, or to drive the system forward one step. Safe to run
anytime — it is read-mostly and idempotent.

## The Loop

**OBSERVE** — Read `EssayState.md`. Read `QualityMetrics.md` if it exists.

**ANALYZE** — Build the dependency picture and find gaps. The canonical pipeline (each stage depends
on the one before, but the Orchestrator backfills gaps automatically):

```
Init → Requirements
     → Discovery:    GrillMe → ApplicantModel → ExperienceGraph → ThemeDiscovery
     → Architecture: NarrativeArchitecture → ProgramAlignment → MessageMap → OutlineGenerator → SectionSpecifications
     → Writing:      VoiceModel → IncrementalWriter (per section) → ReflectionEngine → TransitionEngine → ConclusionEngine
     → Review:       AuthenticityAuditor → CommitteeReview → RevisionLoop
     → Verification: ConsistencyChecker → NarrativeVerifier → FinalReviewer
```

For each artifact compute one of: `missing`, `thin`, `stale`, `ok`. An artifact is **stale** when any
of its `source_hashes` no longer matches the current upstream hash (see CONVENTIONS §3).

**PLAN** — Select the next skill by this priority:

1. **Stale before new.** If any artifact is `stale`, recompute the earliest stale one first —
   staleness propagates downstream, so fixing upstream first avoids wasted work.
2. **Earliest missing/thin gap** along the pipeline.
3. **Convergence loop** once a full draft exists: alternate Review → RevisionLoop → Verification until
   the ratchet (below) says stop.
4. **Ceiling gate.** Before entering the convergence loop, check `QualityMetrics.ceiling`. If
   `quality_threshold > ceiling`, route back to `discovery/GrillMe` (more evidence raises the
   ceiling) rather than revising against an unreachable target.

**EXECUTE** — Set `EssayState.next_skill` to the chosen skill and emit a one-line rationale. The
Orchestrator does not run the skill itself; it hands off. (An autonomous runtime may immediately
invoke the named skill and re-enter the Orchestrator after.)

**VERIFY** — Confirm the chosen skill's `preconditions` hold. If they don't, select the dependency
that satisfies them instead (auto-backfill).

**LEARN** — If the same skill has been selected 3+ times without `QualityMetrics.overall` improving by
`ε`, record a stall in `RevisionHistory` and escalate (see Convergence).

**UPDATE** — Write `EssayState.next_skill`, `EssayState.phase`, `EssayState.updated`. Set
`EssayState.converged: true` and `next_skill: null` when FinalReviewer returns
`READY_FOR_SUBMISSION: YES`.

## Convergence management (the ratchet)

The Orchestrator owns the loop that the SystemsThinking analysis identified as the single leverage
point. Three rules, together, make convergence terminate instead of thrash (this is a design property the agent must uphold, not something the bundled tooling proves):

1. **Best-draft ratchet (kills corruption).** `Drafts` keeps `best/` (the highest-scoring complete
   draft so far) separate from `working/`. Candidates are scored against `best`, not `working`. `best`
   is replaced only by a higher score. The essay can never end worse than its best intermediate state.
2. **ε-improvement-or-stop (kills churn).** A revision round must raise `QualityMetrics.overall` by at
   least `ε` (default `0.02`) to be accepted. A round that doesn't is rejected; two consecutive
   rejected rounds end the convergence loop at `best`.
3. **Ceiling gate (kills impossible targets).** Never enter convergence with `quality_threshold >
   ceiling`. Raise the ceiling via Discovery or lower the threshold with explicit applicant consent.

Termination is therefore guaranteed: either `overall ≥ quality_threshold` (success) or two
non-improving rounds at the ceiling (best-achievable, surfaced honestly to the applicant).

### Composing the ratchet with idempotency (the load-bearing details)

The ratchet and the idempotency contract (`CONVENTIONS.md` §3a–§3d) are defined over the **same** keys,
so they must be reconciled explicitly or they contradict:

1. **The ratchet is the quality join.** Promoting `working/` → `best/` is `max-by-quality`, never a blind
   overwrite (§3a). Replaying a writer can never lower `best`.
2. **The ratchet is per-input-epoch (§3b).** `best/` records the `source_hashes` it was scored against.
   If an upstream artifact changes, that epoch is stale: `best/` is no longer served as best, a new epoch
   opens, and the ratchet re-baselines within it. Monotonic *within* an epoch — never frozen against dead
   inputs.
3. **Unseating requires denoise + margin (§3c).** A candidate is scored as the **median of k=3** judge
   samples and may replace `best/` **only if it beats it by ≥ ε**. This stops the loop from ratcheting on
   judge variance and capturing a fluke score as permanent state.
4. **Terminal accept + hard cap.** Convergence has an explicit terminal state (`converged` or
   best-achievable) AND a hard iteration/cost cap (`max_rounds`, default 12). Hitting the cap settles at
   `best/` and reports honestly — the loop can never spin without settling.
5. **DAG guard.** Staleness propagation walks the `source_hashes` dependency graph, which must be acyclic;
   the Orchestrator refuses to propagate over a cycle (a cycle is a contract bug), so propagation always
   terminates.

## Stall escalation

On a stall (no ε-progress across rounds), escalate in order: `meta/RootCauseAnalysis` (why is the
score stuck?) → `meta/Council` or `meta/RedTeam` (is the narrative or message wrong, not the prose?)
→ surface to the applicant with a specific question via the Orchestrator's hand-off to Discovery.

## Idempotency

Selection is a pure function of state: identical `EssayState` + artifacts ⇒ identical `next_skill`.
Running the Orchestrator twice in a row changes nothing except `updated`.

## Output

```
PHASE: <discovery|architecture|writing|review|verification|done>
STATE: <n artifacts ok, n thin, n missing, n stale>
NEXT:  <skill> — <8-word reason>
QUALITY: overall <x.xx> / threshold <x.xx> / ceiling <x.xx>
```

## Gotchas

- **Never write essay prose.** The Orchestrator schedules; skills write.
- **Stale beats new, always.** Backfilling a new gap while an upstream artifact is stale bakes the
  stale value into downstream work.
- **Do not raise the threshold to force progress.** The threshold is the applicant's bar; the ceiling
  is reality. Close the gap by raising the ceiling (more/deeper evidence), never by moving the bar.
