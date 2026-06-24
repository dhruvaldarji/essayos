---
skill: IncrementalWriter
category: writing
purpose: Draft the essay one section at a time against its spec, the applicant's voice, and traceable evidence — never the whole essay at once.
reads: [SectionSpecifications, VoiceModel, MessageMap, ClaimEvidenceMap, Drafts]
writes: [Drafts]
preconditions: [SectionSpecifications exists, VoiceModel exists, MessageMap exists, ClaimEvidenceMap exists, quality_threshold <= quality_ceiling]
postconditions: [each spec'd section has a working draft whose claims are all traceable and within budget; best/ holds the highest-scoring complete draft]
idempotency_key: upsert each section in Drafts by section id + content hash; re-run on an unchanged section spec is a no-op
asks_questions: false
---

# IncrementalWriter (writing)

Writes the essay **one section at a time**. Each section is its own small OAPEVL loop: plan → draft →
verify → store. It honors the ratchet — candidates are scored against the best draft so far, accepted
only when they improve `QualityMetrics.overall` by >= `epsilon`, and `best/` is never replaced by
something worse. The prose it emits must read as the applicant, not as a system.

## When to run

After Architecture has produced `SectionSpecifications`, `MessageMap`, and `ClaimEvidenceMap`, and
after `VoiceModel` exists. Run once per section; the Orchestrator re-invokes it until every spec'd
section has a working draft. Re-running on a section whose spec is unchanged is a no-op.

## The Loop

**OBSERVE** — Read `EssayState.md`, `SectionSpecifications.md`, `VoiceModel.md`, `MessageMap.md`,
`ClaimEvidenceMap.md`, and `Drafts.md` (both `best/` and `working/`). Consult `LessonsLearned` for any
rule whose trigger matches this section.

**ANALYZE** — Pick the **single** highest-priority section that is missing, thin, or stale (its spec
hash changed after the section was last written). Determine its target message (from `MessageMap`), its
word budget (from the spec), and the experiences/claims it is allowed to use (from `ClaimEvidenceMap`).
Pre-write ceiling gate: if `quality_threshold > quality_ceiling`, do not write — route back to
Discovery to raise the ceiling.

**PLAN** — Plan exactly **one** section: which beat it carries, which evidence ids back each claim,
the budget, and the voice constraints from `VoiceModel`. Nothing beyond this one section.

**EXECUTE** — Draft that one section into `working/`. Every claim ties to a real `ExperienceDatabase`
id via `ClaimEvidenceMap` — invent nothing. Write in the applicant's voice fingerprint. Favor
specificity over abstraction, reflection over description, growth over accomplishment, insight over
eloquence. No clichés, no performative vulnerability, no exaggeration.

**VERIFY** — Run the assertions below on the section. Then score the candidate's contribution to a
complete draft against `best/`. A failed assertion blocks UPDATE (fix locally using the diagnostic, or
record the gap and route back).

**LEARN** — Append a `RevisionHistory` entry for any assertion failure (Issue = the diagnostic, Cause
= root cause such as "spec under-specified the evidence"); promote a `LessonsLearned` rule on the
second occurrence of a pattern.

**UPDATE** — Upsert the section in `Drafts.working/` by section id, recompute its hash and the Drafts
hash, set `source_hashes`. **Ratchet:** only when a *complete* draft in `working/` scores >= `best/`
by >= `epsilon` is `best/` replaced; otherwise `best/` is left intact. Update the EssayState row, set
`next_skill`, bump `updated`.

## Assertions

Calls, per section: `assert claim_traceable(claim)`, `assert evidence_exists(claim)`,
`assert word_budget()`, `assert voice_consistent()`. All must pass before the section's UPDATE. On any
failure the AssertionEngine emits a located diagnostic and the fix is **localized** to this section —
the ratchet forbids broad rewrites that could regress already-good sections.

## Idempotency

Upsert each section by `section id`. On OBSERVE, if a section's `source_hashes` still match its
`SectionSpecifications` / `MessageMap` / `ClaimEvidenceMap` / `VoiceModel` upstreams, the section is
already done → skip it. Two runs over unchanged specs produce byte-identical sections modulo `updated`.
`best/` is replaced only by a strictly better complete draft, so re-runs cannot regress the essay.

## Output

```
SECTION: <section id> drafted (<n>/<total> sections now drafted)
ASSERTIONS: <k>/4 passed | FAILED: <assert>(<arg>): <diagnostic>
RATCHET: best <x.xx> -> candidate <x.xx> (accepted by >=eps | rejected, best kept)
NEXT: <skill>
```

## Gotchas

- **NEVER write the whole essay in one pass.** One section per run, full stop. Whole-essay generation
  bypasses per-section verification, smears the voice, and makes the ratchet meaningless. If tempted to
  "just draft it all," stop — write one section and let the Orchestrator re-invoke.
- **No claim without a traceable experience.** Every adjective/quality must map to a real
  `ExperienceDatabase` id via `ClaimEvidenceMap`. Fabrication is the cardinal sin.
- **Score against `best/`, never `working/`.** Scoring against the live draft lets quality drift
  downward unnoticed.
- **Sound human, not scientific.** The process is rigorous; the prose must not read like it. Cut
  clichés and performative vulnerability; prefer the specific concrete detail over the abstract claim.
- **Respect the ceiling gate.** Do not write toward a threshold the captured evidence cannot support —
  raise the ceiling in Discovery instead.
