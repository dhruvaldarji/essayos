---
schema: EssayState
version: 1.0.0
purpose: The manifest. The single source of truth for an essay's phase, artifacts, and convergence.
machine_readable: true
location: artifacts/<essay_id>/EssayState.md
---

# Schema: EssayState

`EssayState` is the manifest the Orchestrator reads first and every skill consults. It is the index
over all other artifacts: which exist, their hashes, their staleness, and where the process is. The
entire process is reconstructable from this file plus the artifacts it points to.

## Front matter

```yaml
---
essay_id: <slug>              # stable id, e.g. "residency-im-2026"
essay_type: residency | fellowship | personal_statement | diversity | adversity | leadership | specialty | why_program
prompt: <verbatim essay prompt>
word_limit: <int>            # or null if char-limited
char_limit: <int|null>
program: <target program/specialty, or null for a generic statement>
phase: init | discovery | architecture | writing | review | verification | done
status: in_progress | converged | blocked
quality_threshold: 0.85       # the applicant's bar (0–1)
quality_overall: <float|null> # latest QualityMetrics.overall
quality_ceiling: <float|null> # max achievable given current evidence
converged: false
next_skill: <skill name|null> # set by the Orchestrator
gain_floor: 0.05              # interview stops when info gain < this
epsilon: 0.02                 # ratchet minimum improvement
created: <ISO-8601>
updated: <ISO-8601>
shared_with: [<essay_id>, ...] # essays reusing this applicant's ExperienceDatabase/ApplicantModel
---
```

## Body: the artifact registry

A table of every artifact in this essay's workspace. This is what makes idempotency and staleness
work — the Orchestrator compares hashes here against the artifacts on disk.

```markdown
## Artifacts

| artifact | path | status | hash | source_hashes | last_skill | updated |
|----------|------|--------|------|---------------|-----------|---------|
| Requirements | Requirements.md | ok | a1b2 | [] | Init | <ts> |
| ApplicantModel | ApplicantModel.md | thin | c3d4 | [exp:e5f6] | ApplicantModel | <ts> |
| ExperienceDatabase | ExperienceDatabase.md | ok | e5f6 | [] | GrillMe | <ts> |
| ... | ... | ... | ... | ... | ... | ... |
```

- **status** ∈ `missing | thin | stale | ok`.
  - `missing` — no file yet.
  - `thin` — exists but below its skill's postconditions.
  - `stale` — a `source_hash` no longer matches the current upstream `hash`.
  - `ok` — postconditions hold and not stale.
- **hash** — short content hash of the artifact's meaningful body.
- **source_hashes** — the hashes of the artifacts this one was derived from, as `name:hash`. This is
  the staleness mechanism: if `ExperienceDatabase` hash changes, anything listing the old `exp:`
  hash becomes `stale`.

## The 16 tracked artifacts

EssayState always tracks these (created lazily; `missing` until first written):

1. `Requirements` 2. `ApplicantModel` 3. `ExperienceDatabase` 4. `ExperienceGraph`
5. `ThemeGraph` 6. `NarrativeModel` 7. `ProgramFitModel` 8. `MessageMap` 9. `Outline`
10. `SectionSpecifications` 11. `VoiceModel` 12. `Drafts` 13. `ReviewerFeedback`
14. `RevisionHistory` 15. `QualityMetrics` 16. `LessonsLearned`

(`ClaimEvidenceMap` is maintained by `meta/ClaimEvidenceMapper`; `MemoryGraph` is the union view over
`ExperienceGraph` + `ThemeGraph` maintained by `meta/MemoryGraph`.)

## Shared artifacts across essays

`ExperienceDatabase`, `ApplicantModel`, and `VoiceModel` are **applicant-scoped**, not essay-scoped.
A second essay (e.g. a fellowship statement after a residency one) reuses them via `shared_with`,
pointing at the originating essay's files rather than re-interviewing from scratch. Essay-specific
artifacts (Requirements, MessageMap, Outline, Drafts, …) are never shared.

## Idempotency rules for this file

- The registry is upsert-by-artifact-name. A skill updates only its own rows.
- `updated` changes on every write; nothing else changes if the run was a no-op.
- `converged: true` requires `FinalReviewer` `READY_FOR_SUBMISSION: YES` recorded in QualityMetrics.

## Example (abbreviated)

```yaml
---
essay_id: residency-im-2026
essay_type: residency
prompt: "Why do you want to pursue Internal Medicine, and what makes you a strong fit?"
word_limit: 750
program: Internal Medicine
phase: writing
status: in_progress
quality_threshold: 0.85
quality_overall: 0.71
quality_ceiling: 0.88
converged: false
next_skill: IncrementalWriter
gain_floor: 0.05
epsilon: 0.02
created: 2026-06-23T00:00:00Z
updated: 2026-06-23T00:42:00Z
shared_with: []
---
```
