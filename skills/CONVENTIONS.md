---
contract: skill-conventions
version: 1.0.0
applies_to: every skill and specialist in EssayOS
---

# EssayOS Skill Contract (read once, applies to all skills)

This file is the universal contract. Every skill in `kernel/`, `system/`, `discovery/`,
`architecture/`, `writing/`, `review/`, `verification/`, `meta/`, and every agent in `specialists/`
obeys it. A skill that violates this contract is a bug.

---

## 1. Skill file shape

Every skill is a single Markdown file with YAML front matter:

```yaml
---
skill: <TitleCaseName>
category: discovery | architecture | writing | review | verification | system | kernel | meta
purpose: <one sentence>
reads: [EssayState, <ArtifactName>, ...]        # artifacts it consumes
writes: [<ArtifactName>, ...]                    # artifacts it upserts
preconditions: [<ISC-style predicate>, ...]      # what must be true to run
postconditions: [<ISC-style predicate>, ...]     # what is true after it runs
idempotency_key: <how a re-run detects "already done">
asks_questions: true | false
---
```

The body always has these sections, in this order: `## When to run`, `## The Loop`
(OBSERVE/ANALYZE/PLAN/EXECUTE/VERIFY/LEARN/UPDATE), `## Assertions`, `## Idempotency`,
`## Output`, `## Gotchas`.

## 2. The deterministic loop (OAPEVL+U)

Prefer this loop over one-shot generation. **Always.**

| Step | Obligation |
|------|-----------|
| **OBSERVE** | Read `EssayState.md` and every artifact in `reads:`. Never act on memory of a prior run — read the files. |
| **ANALYZE** | Determine the gap: what is missing, thin, or **stale** (an upstream artifact changed after this one was last written). |
| **PLAN** | Choose the *smallest* next unit of work. For interviews that is **one question**. For writing that is **one section**. |
| **EXECUTE** | Do exactly that unit. Nothing more. |
| **VERIFY** | Run the assertions listed in `## Assertions` (via `kernel/AssertionEngine`). A failed assertion blocks UPDATE. |
| **LEARN** | Append an entry to `RevisionHistory` (Issue / Cause / Fix / Outcome) and, if a reusable lesson emerged, to `LessonsLearned`. |
| **UPDATE** | Upsert the `writes:` artifacts by stable ID, recompute their `hash`, update their `depends_on`, set `EssayState.next_skill`, bump `EssayState.updated`. |

## 3. Idempotency (non-negotiable)

A re-run must never corrupt state or duplicate work.

- **Upsert by stable ID, never blind append.** Every record in every artifact has an `id`. Writing
  is "find by id → replace; else insert." Two runs of the same skill on unchanged inputs produce a
  byte-identical artifact (modulo the `updated` timestamp).
- **Content hash + provenance.** Each artifact's front matter carries `hash:` (a hash of its
  meaningful content) and `source_hashes:` (the hashes of the artifacts it was derived from). On
  OBSERVE, a skill compares: if its output already exists and all `source_hashes` still match the
  current upstream hashes, the work is **already done** — skip and report "no change."
- **Staleness propagation.** If an upstream artifact's hash no longer matches a downstream artifact's
  recorded `source_hashes`, the downstream is **stale**. Mark it `status: stale` in EssayState. Stale
  artifacts are recomputed before anything that depends on them runs. This is how "the applicant
  changed an earlier answer" cannot silently poison the essay.
- **Completion detection.** A skill declares "done for now" when its `postconditions` hold and no
  `reads:` artifact is newer than its output.

### 3a. Quality-aware merge — upsert is a join, not last-write-wins

Plain "upsert-by-id, last write wins" is **not** idempotent once a quality ratchet exists: re-running a
non-deterministic writer can produce a *worse* draft, and a blind overwrite would clobber the better
one. So UPDATE is a **join on a quality-ordered lattice**, not a replace:

- **Unscored artifacts** (Requirements, ExperienceDatabase, ApplicantModel, ExperienceGraph, …) merge
  by **id union** — re-running adds/updates records by id; there is no "worse," so plain upsert is the
  join.
- **Scored artifacts** (`Drafts` sections, and any candidate carrying a `QualityMetrics` score) merge
  by **max-by-quality**: `merge(a, b) = the higher-scored of a, b`. This makes the merge commutative,
  associative, and idempotent — replaying a step can never lower state. The ratchet **is** this join.

### 3b. Epochs — the ratchet resets when inputs change

A monotonic ratchet and staleness propagation only compose if the ratchet is **keyed to an input
epoch**. Every scored artifact records the `source_hashes` it was scored against (its *epoch*). When an
upstream artifact changes, a **new epoch opens**: the prior best is marked `stale` and is **not** served
as best anymore (serving a draft scored against inputs that no longer exist is the failure this
prevents). Within an epoch the ratchet is strictly monotonic; across epochs it re-baselines. So
"monotonic" means *monotonic within an input epoch*, never "frozen forever against dead inputs."

### 3c. Denoise + margin — don't ratchet on judge noise

Scores come from an LLM judge with variance. To avoid locking in a lucky-high fluke: a candidate's score
is the **median of k samples** (default k=3), and a candidate may unseat the incumbent best **only if it
beats it by the margin `ε`** (the same `ε` as the ratchet). `ε` is the hysteresis band; median-of-k is
the denoiser. Together they stop measurement variance from becoming irreversible state.

### 3d. Atomicity, provenance, and the staleness DAG

- **Atomic write.** Write the new artifact to a temp path, then rename into place. A crash never leaves a
  half-written artifact behind a stable id.
- **Input-epoch provenance.** Every artifact carries `source_hashes` (its epoch) so staleness is
  computable and the "which inputs was this scored against?" question always has an answer.
- **Human-edit provenance.** If a human edits a draft out of band, it re-enters as a **new scored
  candidate** (re-scored, subject to the same join) — it is not silently treated as the new best. This
  keeps the monotonicity claim honest.
- **The dependency graph is a DAG.** Staleness propagation walks `source_hashes` edges; the Orchestrator
  refuses to propagate over a cycle (a cycle is a contract bug) so propagation always terminates.

## 4. State is on disk, always

Nothing the system needs lives only in conversation. After every skill run the entire process is
reconstructable from `artifacts/<essay_id>/`. This is what makes EssayOS restartable, replayable,
and re-verifiable. If you cannot resume from the files alone, the skill broke the contract.

## 5. `ask_question()` — adaptive interview protocol

When `asks_questions: true`, all applicant interaction goes through this protocol:

1. Ask **exactly one** question. Never present a list, never batch.
2. Wait for the answer.
3. **Update state** — write the answer into the target artifact immediately (upsert by id).
4. **Reassess information gain** — estimate how much the *next best* question would add, given
   everything now known. Information gain is "would the answer change a downstream artifact?"
5. If gain is meaningful, choose the next single question (often a follow-up that drills into the
   most surprising or thinnest part of the last answer — cognitive-interview style) and go to 1.
6. If gain approaches zero (`< gain_floor`, default the answer would not move any artifact), **stop**
   and hand control back to the Orchestrator.

Questions should feel like a curious, attentive human interviewer: specific, following the energy of
the last answer, never interrogating from a fixed script.

## 6. Assertions

Skills do not self-certify. They call named assertions defined in `kernel/AssertionEngine.md`, e.g.
`assert theme_supported()`, `assert reflection_present()`, `assert evidence_exists()`. A failing
assertion produces a **diagnostic** (what failed, where, why) and blocks the UPDATE step. The skill
then either fixes the issue (localized) or records the gap and routes back to the Orchestrator.

## 7. The ratchet (for any skill that mutates `Drafts`)

Writing and revision skills must honor the monotonic best-draft ratchet (full spec in
`kernel/Orchestrator.md` and `review/RevisionLoop.md`):

- Score every candidate against the **best draft so far**, not the live mutable draft.
- **Accept-only:** never replace the best with something worse.
- **ε-improvement:** an accepted revision must close the quality gap by at least `ε` (default `0.02`
  on the 0–1 `QualityMetrics` scale); otherwise it is rejected and the loop is allowed to terminate.
- **Pre-write ceiling gate:** do not enter the convergence loop if `quality_threshold` exceeds the
  ceiling the captured knowledge can support — instead route back to Discovery to raise the ceiling.

## 8. Portability

Pure Markdown + YAML. No model-specific features, no required runtime, no network calls. An optional
zero-dependency inspector lives in `bin/` for deterministic hash/assertion checks, but every skill
must be fully executable by an agent reading these files alone.

## 9. Output discipline

A skill's output is the **artifact change plus a short report** of: what unit was done, which
assertions ran and passed, what (if anything) is now stale, and the recommended next skill. Keep
chat output terse; the artifacts are the record.
