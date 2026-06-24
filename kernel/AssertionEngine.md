---
skill: AssertionEngine
category: kernel
purpose: Define the named assertions that gate quality; run them and emit diagnostics on failure.
reads: [EssayState, Drafts, ExperienceGraph, ThemeGraph, MessageMap, SectionSpecifications, ClaimEvidenceMap, QualityMetrics]
writes: [QualityMetrics, RevisionHistory]
preconditions: [the artifact under assertion exists]
postconditions: [each named assertion has a pass/fail + diagnostic]
idempotency_key: same inputs produce same pass/fail verdicts
asks_questions: false
---

# AssertionEngine (kernel)

Skills do not self-certify. They call named assertions here. Each assertion is a binary predicate
with a tool-verifiable proxy and a **diagnostic** emitted on failure. A failed assertion blocks the
calling skill's UPDATE step.

## The assertion catalog

Each assertion: a predicate, the proxy used to evaluate it, and what the diagnostic must say.

| Assertion | Passes when | Proxy / how to check | Diagnostic on failure |
|-----------|-------------|----------------------|-----------------------|
| `assert theme_supported(theme)` | the theme is backed by **≥2** distinct experiences | count `ExperienceGraph` nodes linked to the theme in `ThemeGraph` | name the theme + how many experiences support it (e.g. "only 1") |
| `assert reflection_present(section)` | the section contains insight/growth, not just description | a sentence in the section answers "what did this change in me?"; flag if all sentences are event-narration | quote the description-only span; suggest the reflective turn |
| `assert opening_resolves()` | the conclusion pays off an image/idea/question raised in the opening | a token/concept from para 1 recurs, transformed, in the final para | name the opening hook that is never resolved |
| `assert evidence_exists(claim)` | every asserted virtue/quality is *shown* by a specific experience | each adjective-claim maps to an `ExperienceGraph` id via `ClaimEvidenceMap` | list claims with no backing experience |
| `assert redundancy_low()` | no theme/anecdote/phrase repeats without adding meaning | n-gram + concept overlap across sections below threshold | quote the repeated span and its twin |
| `assert authenticity_preserved()` | no cliché, no exaggeration, no performative vulnerability, voice intact | cliché list scan + VoiceModel fingerprint distance below threshold | quote the offending line and the failing dimension |
| `assert word_budget()` | draft length is within the prompt's word/character limit | count vs `Requirements.word_limit` | report over/under by N |
| `assert prompt_answered()` | the essay actually answers the stated prompt | each clause of the prompt maps to ≥1 section in `SectionSpecifications` | name the prompt clause not addressed |
| `assert voice_consistent()` | one voice throughout | VoiceModel fingerprint variance across sections below threshold | name the section that drifts |
| `assert timeline_consistent()` | no contradictory dates/sequence | extract temporal markers, check ordering | quote the conflicting markers |
| `assert claim_traceable(claim)` | claim → experience link exists and is non-fabricated | `ClaimEvidenceMap` has an entry sourced to a real `ExperienceDatabase` id | name the untraceable claim |
| `assert monotonic_improvement()` | a candidate scores ≥ best by ≥ ε | compare `QualityMetrics.overall` candidate vs best | report the delta and that it is < ε |

### System-integrity assertions

Used by the `system/` skills (Init / Status / Resume) to verify the workspace itself, not the prose.

| Assertion | Passes when | Proxy / how to check | Diagnostic on failure |
|-----------|-------------|----------------------|-----------------------|
| `assert workspace_exists()` | `artifacts/<essay_id>/` exists with the seeded artifact files | directory + file presence | name the missing path |
| `assert state_parses()` | `EssayState.md` front matter parses and has required fields | parse front matter keys | name the missing/malformed field |
| `assert registry_complete()` | the artifact registry lists all 16 tracked artifacts | count rows vs the canonical list | name the artifact rows missing |
| `assert registry_covered()` | every artifact file on disk has a registry row and vice-versa | set-compare disk vs registry | name the unlisted/orphan artifact |
| `assert registry_matches_disk()` | each registry `hash` matches the artifact file's current hash | recompute + compare | name the row whose hash is stale |
| `assert reconstructable()` | full state is derivable from disk with no conversation context | Resume produces the same `next_skill` from files alone | name what could not be reconstructed |
| `assert phase_consistent()` | `EssayState.phase` agrees with which artifacts are `ok` | compare phase vs registry statuses | name the phase/registry mismatch |
| `assert read_only()` | a read-only skill wrote nothing | no artifact hash changed across the run | name the artifact that was mutated |

### Canonical evidence source (drift guard)

`ExperienceDatabase` is the **single canonical source of truth** for claims and evidence — every claim
ultimately traces to an `ExperienceDatabase` experience id. `ExperienceGraph` is a *structured view*
over those same experiences and **reuses the identical experience ids** as node ids. So
`assert claim_traceable()` and `assert evidence_exists()` may resolve a claim through either artifact,
but the id they land on is always an `ExperienceDatabase` id. When in doubt, trace to
`ExperienceDatabase`. (`meta/ClaimEvidenceMapper` enforces this; specialists that read
`ExperienceGraph` are reading the structured view of the same source, not a second source.)

## Running assertions

A skill calls the assertions named in its own `## Assertions` section. The engine:

1. Evaluates each predicate via its proxy against the current artifacts.
2. Records the verdict and (on fail) the diagnostic in `QualityMetrics.assertions[]`.
3. Returns `pass` only if **all** requested assertions pass.
4. On any fail, appends a `RevisionHistory` entry (`Issue` = the diagnostic) so the failure is part
   of the durable record, and blocks the caller's UPDATE.

## Diagnostics drive repair, not just rejection

A diagnostic is actionable by construction: it names the location, the failing dimension, and a
suggested repair. The calling skill uses it to make a **localized** fix (one section, one claim) — the
ratchet forbids broad rewrites that risk regressing good sections.

## Idempotency

Pure evaluation over artifacts: identical artifacts ⇒ identical verdicts and diagnostics. The engine
writes only `QualityMetrics` (verdicts) and `RevisionHistory` (on failure), both upsert-by-id.

## Output

```
ASSERTIONS: <k>/<n> passed
FAILED:
  <assert_name>(<arg>): <diagnostic>
```

## Gotchas

- **Every assertion needs a tool-verifiable proxy.** "Sounds authentic" is not checkable; "no phrase
  from the cliché list AND VoiceModel distance < t" is. Keep proxies concrete.
- **A diagnostic with no location is a bug.** Always point at the exact span/claim/section.
- **Assertions gate UPDATE, never EXECUTE.** Let the skill do its unit, then verify; don't pre-block.
