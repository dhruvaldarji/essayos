---
project: EssayOS
slug: essayos
effort: deep
phase: complete
progress: 148/148
mode: build
started: 2026-06-23
updated: 2026-09-19
---

# ISA — EssayOS

The Ideal State Artifact for EssayOS itself: the spec, test harness, and system of record for the
package. Iterating on EssayOS is iterating on this file.

## Problem

People writing high-stakes application essays (college admissions, scholarships, graduate school
statements, fellowships, grants, job letters, and more) reach for AI and get a *prompt chain*: one big
prompt that generates a plausible, generic, often-fabricated essay in a single pass.
It cannot be resumed, cannot prove its claims trace to real experiences, asks ten questions at once,
corrupts good paragraphs when revising, and revises forever without a stop condition. The result
reads like AI, not like the applicant. There is no reusable *system* — only a prompt people copy and
re-paste.

## Vision

A package that behaves like an operating system for essay-writing: you initialize an essay, ask "what
next?", and a scheduler walks you from empty to submission-ready through small, verified, resumable
steps. It elicits *your* real experiences, structures them, selects the strongest, drafts in *your*
voice, stress-tests against skeptical reviewers, and proves every claim is yours. You can stop
anytime and resume exactly where you left off. The euphoric surprise: the "OS feel" comes from two
structural choices — idempotent upsert-by-ID artifacts and a monotonic best-draft ratchet — not from
having many skills.

## Out of Scope

Not a web app, GUI, or hosted service — it is a portable file package. Not a content *generator* —
it never invents experiences the applicant didn't supply. Not model-specific — no Claude-only or
Codex-only features. v1 does not auto-submit to application portals, does not manage deadlines, does
not handle letters of recommendation, secondaries beyond essays, or multi-language output. No
analytics, no telemetry, no network calls. The optional `bin/` inspector is a convenience, not a
dependency.

## Principles

- The applicant is the only source of truth for experiences (elicit, never fabricate).
- State lives on disk; nothing the system needs is conversation-only (Deutsch: knowledge is durable).
- Science shapes the process; the prose stays human.
- Specificity > abstraction; reflection > description; growth > accomplishment; insight > eloquence.
- Every claim must be traceable to a real experience.
- Smallest next unit of work, always — one question, one section.
- Determinism where possible: same inputs ⇒ same outputs.

## Constraints

- Pure Markdown + YAML. No model-specific dependencies. Runnable by Claude or Codex unchanged.
- Every artifact is machine-readable: Markdown with YAML front matter.
- Every skill is independently callable and inspects state before acting (no assumed prior run).
- Idempotent: re-running any skill never duplicates or corrupts state.
- Restartable/replayable: full process reconstructable from `artifacts/<essay_id>/`.
- Questions asked one at a time via `ask_question()`; never batch.
- Revision is monotonic (best-draft ratchet); convergence must terminate (bounded by a hard round cap).

## Goal

Ship a portable EssayOS package — README + ISA + kernel (3) + system (3) + discovery (4) +
architecture (5) + writing (5) + review (3) + verification (3) + specialists (6) + meta (11) + 16
artifact schemas + templates + skill registry + conventions — where every skill conforms to the
universal OAPEVL+U contract, every artifact is idempotent upsert-by-ID, the convergence loop is a
terminating best-draft ratchet (bounded by a round cap), and `ask_question()` enforces one-at-a-time adaptive
interviewing. Done = every file below exists with required sections, and the cross-file vocabulary
(EssayState fields, artifact names, assertion names) is consistent.

## Criteria

### Top-level package
- [ ] ISC-1: `README.md` exists and states "elicitation + arrangement + verification engine, not a generation engine"
- [ ] ISC-2: `README.md` documents the package layout matching the actual directory tree
- [ ] ISC-3: `README.md` documents the OAPEVL+U loop and the two structural invariants (idempotency, ratchet)
- [ ] ISC-4: `ISA.md` (this file) has all twelve sections populated
- [ ] ISC-5: `CONVENTIONS.md` defines the universal skill front-matter shape
- [ ] ISC-6: `CONVENTIONS.md` defines the `ask_question()` one-at-a-time protocol with info-gain stop
- [ ] ISC-7: `CONVENTIONS.md` defines idempotency (upsert-by-id, hash, staleness propagation)
- [ ] ISC-8: `CONVENTIONS.md` defines the ratchet rules referenced by writing/review skills
- [ ] ISC-9: `SKILLS.md` registry lists every skill with its category and one-line purpose
- [ ] ISC-10: directory tree contains kernel/system/discovery/architecture/writing/review/verification/specialists/meta/skills/schemas/templates/bin

### Kernel
- [ ] ISC-11: `kernel/Orchestrator.md` exists, selects next skill from state, writes only EssayState
- [ ] ISC-12: Orchestrator documents the canonical pipeline ordering
- [ ] ISC-13: Orchestrator implements "stale before new" selection priority
- [ ] ISC-14: Orchestrator owns the convergence ratchet (best-draft + ε-improvement + ceiling gate)
- [ ] ISC-15: Orchestrator guarantees termination (success or two non-improving rounds at ceiling)
- [ ] ISC-16: `kernel/AssertionEngine.md` defines all named asserts from the spec
- [ ] ISC-17: AssertionEngine: each assertion has a tool-verifiable proxy + diagnostic
- [ ] ISC-18: AssertionEngine failure blocks UPDATE and writes RevisionHistory
- [ ] ISC-19: `kernel/LearningLayer.md` defines RevisionHistory Issue/Cause/Fix/Outcome record
- [ ] ISC-20: LearningLayer promotes recurring issues (≥2) into LessonsLearned rules
- [ ] ISC-21: LearningLayer states humans (applicant) are never the root cause

### Discovery
- [ ] ISC-22: `discovery/GrillMe.md` exists; adaptive interview; outputs ExperienceDatabase
- [ ] ISC-23: GrillMe cites retrieval practice + cognitive interview; asks one question at a time
- [ ] ISC-24: GrillMe covers childhood, motivations, mentors, failures, patient encounters, leadership, adversity, growth, aspirations
- [ ] ISC-25: GrillMe stops when information gain approaches zero
- [ ] ISC-26: `discovery/ApplicantModel.md` infers values, strengths, identity, motivations, future-physician model
- [ ] ISC-27: `discovery/ExperienceGraph.md` represents Context/Conflict/Actions/Outcomes/Reflection/Lessons/Themes/IdentitySignals/FutureImplications per experience
- [ ] ISC-28: ExperienceGraph links experiences into a graph (edges defined)
- [ ] ISC-29: `discovery/ThemeDiscovery.md` infers a theme only if supported by ≥2 experiences
- [ ] ISC-30: ThemeDiscovery forbids adjective-based themes

### Architecture
- [ ] ISC-31: `architecture/NarrativeArchitecture.md` supports Hero Journey, Mosaic, Framing Device, Single Transformation, Multiple Vignettes, Chronological Growth
- [ ] ISC-32: NarrativeArchitecture selects structure from evidence, not default
- [ ] ISC-33: `architecture/ProgramAlignment.md` constructs Past Self / Current Self / Future Physician / Program Fit
- [ ] ISC-34: `architecture/MessageMap.md` determines Core Message / Supporting Themes / Stories / Emotional Objectives
- [ ] ISC-35: `architecture/OutlineGenerator.md` generates section skeletons and does NOT generate prose
- [ ] ISC-36: `architecture/SectionSpecifications.md` defines Purpose/Evidence/Emotion/Transition/Takeaway per section

### Writing
- [ ] ISC-37: `writing/VoiceModel.md` infers voice (rhythm, vocabulary, sentence length, tone) from samples
- [ ] ISC-38: `writing/IncrementalWriter.md` writes one section at a time; never the whole essay at once
- [ ] ISC-39: IncrementalWriter per-section loop is plan → draft → verify → store
- [ ] ISC-40: `writing/ReflectionEngine.md` increases meaning density (insight>description, growth>accomplishment, specificity>abstraction)
- [ ] ISC-41: `writing/TransitionEngine.md` improves flow between sections
- [ ] ISC-42: `writing/ConclusionEngine.md` resolves opening themes
- [ ] ISC-43: all writing skills honor the best-draft ratchet (score vs best, accept-only, ε)

### Review
- [ ] ISC-44: `review/AuthenticityAuditor.md` verifies virtue demonstrated, humility, earned emotion, no exaggeration, no clichés, no performative vulnerability
- [ ] ISC-45: `review/CommitteeReview.md` simulates Program Director, Faculty Member, Busy Reviewer, Skeptic
- [ ] ISC-46: CommitteeReview produces strengths, concerns, memorability, suggestions
- [ ] ISC-47: `review/RevisionLoop.md` is Issue→RootCause→Fix→LocalizedRevision→Reverify→UpdateHistory
- [ ] ISC-48: RevisionLoop revisions are localized (no broad rewrites) and ratchet-gated

### Verification
- [ ] ISC-49: `verification/ConsistencyChecker.md` checks voice, theme, timeline, identity consistency
- [ ] ISC-50: `verification/NarrativeVerifier.md` checks opening resolved, themes recur, future goals present, growth visible
- [ ] ISC-51: `verification/FinalReviewer.md` scores authenticity, specificity, reflection, voice, flow, memorability, program fit
- [ ] ISC-52: FinalReviewer returns READY_FOR_SUBMISSION YES/NO with rationale

### Specialists (agents)
- [ ] ISC-53: `specialists/NarrativePsychologist.md` — analyzes meaning and growth
- [ ] ISC-54: `specialists/PhysicianMentor.md` — reviews medical identity
- [ ] ISC-55: `specialists/ProgramDirector.md` — evaluates fit
- [ ] ISC-56: `specialists/Skeptic.md` — challenges weak claims
- [ ] ISC-57: `specialists/CopyEditor.md` — improves prose
- [ ] ISC-58: `specialists/AuthenticityAuditor.md` — protects voice
- [ ] ISC-59: each specialist file declares its persona, when invoked, inputs, and output shape

### Meta skills
- [ ] ISC-60: `meta/Council.md` — independent deliberation then synthesis
- [ ] ISC-61: `meta/RedTeam.md` — attacks assumptions, clichés, unsupported claims, weak narratives
- [ ] ISC-62: `meta/FirstPrinciples.md` — reduce to fundamentals, challenge inherited assumptions
- [ ] ISC-63: `meta/ApertureOscillation.md` — alternate macro/micro across essay/section/paragraph/sentence/word
- [ ] ISC-64: `meta/RootCauseAnalysis.md` — repeated why, diagnose underlying weakness
- [ ] ISC-65: `meta/CompressionExpansion.md` — compress to core, expand selectively
- [ ] ISC-66: `meta/Inversion.md` — "what would make this essay fail?" then avoid it
- [ ] ISC-67: `meta/Counterfactuals.md` — explore alternate narratives
- [ ] ISC-68: `meta/MemoryGraph.md` — maintain relationships between experiences and themes
- [ ] ISC-69: `meta/ClaimEvidenceMapper.md` — every claim traceable to an experience
- [ ] ISC-70: `meta/DeliberatePractice.md` — improve one dimension at a time

### Schemas (16 artifacts + map)
- [ ] ISC-71: `schemas/EssayState.md` — manifest with artifact registry, hashes, staleness
- [ ] ISC-72: `schemas/Requirements.md`
- [ ] ISC-73: `schemas/ApplicantModel.md`
- [ ] ISC-74: `schemas/ExperienceDatabase.md`
- [ ] ISC-75: `schemas/ExperienceGraph.md`
- [ ] ISC-76: `schemas/ThemeGraph.md`
- [ ] ISC-77: `schemas/NarrativeModel.md`
- [ ] ISC-78: `schemas/ProgramFitModel.md`
- [ ] ISC-79: `schemas/MessageMap.md`
- [ ] ISC-80: `schemas/Outline.md`
- [ ] ISC-81: `schemas/SectionSpecifications.md`
- [ ] ISC-82: `schemas/VoiceModel.md`
- [ ] ISC-83: `schemas/Drafts.md` (best/ vs working/ separation)
- [ ] ISC-84: `schemas/ReviewerFeedback.md`
- [ ] ISC-85: `schemas/RevisionHistory.md`
- [ ] ISC-86: `schemas/QualityMetrics.md` (7 dimensions + overall + ceiling + assertions[])
- [ ] ISC-87: `schemas/LessonsLearned.md`
- [ ] ISC-88: `schemas/ClaimEvidenceMap.md`
- [ ] ISC-89: every schema declares YAML front matter and is machine-readable
- [ ] ISC-90: every schema's field names match the names referenced in kernel + skills

### Templates
- [ ] ISC-91: `templates/` contains a blank starter for each of the 16 artifacts
- [ ] ISC-92: each template is valid against its schema (front matter present, required fields stubbed)

### System skills
- [ ] ISC-93: `system/Init.md` creates `artifacts/<essay_id>/` from templates and first EssayState
- [ ] ISC-94: `system/Status.md` reports phase, artifact statuses, quality vs threshold/ceiling
- [ ] ISC-95: `system/Resume.md` reconstructs state from disk and routes to Orchestrator

### Cross-cutting invariants
- [ ] ISC-96: every skill file has the required front matter (skill, category, reads, writes, preconditions, postconditions, idempotency_key, asks_questions)
- [ ] ISC-97: every skill body has When-to-run / The Loop / Assertions / Idempotency / Output / Gotchas
- [ ] ISC-98: every skill's `reads`/`writes` reference only artifact names that have a schema
- [ ] ISC-99: every assertion named in a skill exists in AssertionEngine
- [ ] ISC-100: idempotency: re-running a skill on unchanged inputs is a documented no-op
- [ ] ISC-101: staleness: changing an upstream artifact marks dependents stale (documented mechanism)
- [ ] ISC-102: shared artifacts (ExperienceDatabase, ApplicantModel, VoiceModel) are applicant-scoped and reusable across essays
- [ ] ISC-103: all eight essay types in scope are named somewhere a router can dispatch on them
- [ ] ISC-104: optional `bin/` inspector documented as optional; package works without it

### Anti-criteria
- [ ] ISC-105: Anti: no skill generates a full essay in one pass
- [ ] ISC-106: Anti: no skill asks more than one question per turn
- [ ] ISC-107: Anti: no theme is asserted without ≥2 supporting experiences
- [ ] ISC-108: Anti: no claim appears in a draft without a ClaimEvidenceMap entry to a real experience
- [ ] ISC-109: Anti: revision never replaces the best draft with a lower-scoring one
- [ ] ISC-110: Anti: no model-specific dependency (no "Claude only"/"Codex only" feature) anywhere
- [ ] ISC-111: Anti: no required network call or external service
- [ ] ISC-112: Anti: no scientific/clinical jargon leaks into the final prose guidance (science shapes process only)
- [ ] ISC-113: Anti: no hidden state — nothing required exists only in conversation
- [ ] ISC-114: Anti: re-running Init on an existing essay does not overwrite existing artifacts

### Invariant composition (advisor-hardened 2026-06-23)
- [x] ISC-115: idempotency UPDATE is a quality-aware join (max-by-quality for scored artifacts; id-union for unscored) — not last-write-wins (CONVENTIONS §3a)
- [x] ISC-116: the ratchet is per-input-epoch — staleness opens a new epoch and re-baselines; stale-best is never served (CONVENTIONS §3b, Orchestrator)
- [x] ISC-117: unseating the best requires median-of-k denoised score AND a ≥ε margin (CONVENTIONS §3c, Orchestrator)
- [x] ISC-118: convergence has an explicit terminal-accept state AND a hard iteration cap (max_rounds) (Orchestrator)
- [x] ISC-119: artifact writes are atomic (temp+rename); every artifact carries input-epoch provenance (source_hashes) (CONVENTIONS §3d)
- [x] ISC-120: human out-of-band edits re-enter as new scored candidates, never silently treated as best (CONVENTIONS §3d)
- [x] ISC-121: staleness propagation is over a DAG; cycles are refused (CONVENTIONS §3d, Orchestrator)
- [x] ISC-122: Anti: idempotent replay never lowers a scored artifact below its prior best

### Codex packaging (2026-09-19)
- [x] ISC-123: `plugin.json` at the root is a portable Agent Plugins 1.0.0 manifest (`$schema`, kebab `name`, semver `version`, `description`, no unknown keys, OpenAI metadata under `extensions.com.openai`), and the `.codex-plugin/plugin.json` overlay exists with `skills: ./skills/` and an `interface` identical to the root's (lint: `lintManifests`)
- [x] ISC-124: `.agents/plugins/marketplace.json` exists, parses, and lists `essayos` with `source: {source: local, path: ./}` (lint: `lintManifests`)
- [x] ISC-125: every directory under the Codex `skills` path has a `SKILL.md` whose `name` equals the directory name and that has a `description` (lint: `lintManifests`)
- [x] ISC-126: the entry skills in `skills/` (Agent Skills format) serve Claude Code and Codex from one set of files: `essayos`, `essay-init`, `essay-ingest`, `essay-scan`, `essay-next`, `essay-status`, `essay-resume`, `essay-lint`; there is no separate `commands/` directory (lint: required files + `lintManifests`)
- [x] ISC-127: `package.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` (metadata + essayos entry), and `.codex-plugin/plugin.json` carry the same version (lint: `lintManifests`)
- [x] ISC-128: `claude plugin validate . --strict` passes (CI: `plugin-validate` job)

### Third-party skills: humanizer + simple-english (2026-09-19)
- [x] ISC-129: `.claude-plugin/plugin.json` declares no `dependencies`; the two skills are bundled in `skills/` and load in Claude Code and Codex from the same files (lint: `lintManifests`; probe: `claude --plugin-dir .` lists `essayos:humanizer`)
- [x] ISC-130: `.claude-plugin/marketplace.json` lists both upstreams as optional standalone installs with a `github` source pinned to a 40-char commit `sha` equal to the bundled pin (lint: `lintVendored`)
- [x] ISC-131: `skills/VENDORED.json` records name, version, repo, ref, sha, license, and file map for each vendored skill (lint: `lintVendored`)
- [x] ISC-132: each vendored `SKILL.md` has `metadata.version` equal to the pin and ships its `LICENSE` (lint: `lintVendored`)
- [x] ISC-133: the marketplace pin (version, repo, sha) equals the VENDORED.json pin, so a standalone install and the bundled copy run identical skill text (lint: `lintVendored`)
- [x] ISC-134: `node bin/essayos.mjs skills-sync` compares the vendored copies with upstream at the pinned sha and `--update` rewrites both pins (manual; network)
- [x] ISC-135: `CONVENTIONS.md` §10 names both skills, their versions, what each is used for, what each is never used for, and where they live per runtime (Read)
- [x] ISC-136: `IncrementalWriter`, `RevisionLoop`, and `PersonalizationReview` run the humanizer pass in embedded mode with the VoiceModel samples as the writing sample before storing prose (Grep "humanizer" in each)
- [x] ISC-137: `simple-english` governs `ask_question()` wording (§5a) and applicant-facing report prose (§9) and is never applied to essay prose (Grep "the essay prose, ever" in CONVENTIONS)
- [x] ISC-138: README, AGENTS.md, CONTRIBUTING.md, and `skills/essay*/SKILL.md` have no em-dash or semicolon in prose and no sentence over 25 words (lint: `lintPlainDocs`)

### Ingest flow (2026-09-19)
- [x] ISC-139: `system/Ingest.md` stores the applicant's essay verbatim as `draft-ingested`, records `self_authored`, sets `EssayState.mode: ingest`, and never rewrites (lint: contract + guard "never rewrites")
- [x] ISC-140: `architecture/ReverseOutline.md` derives Outline, SectionSpecifications, and an inferred MessageMap from the ingested draft without changing its text (lint: contract; assertion `ingest_preserved`)
- [x] ISC-141: `review/AITellScan.md` flags AI tells from the humanizer catalog and monotone sections, located, and never fixes (lint: contract)
- [x] ISC-142: `review/PersonalizationReview.md` proposes one before/after suggestion at a time, sourced to a real `ExperienceDatabase` id, and records the applicant's decision before anything is applied (lint: contract + guard "no source experience, no rewrite")
- [x] ISC-143: `kernel/Orchestrator.md` documents the ingest pipeline and routes `RevisionLoop` only on an `accepted|edited` suggestion (Grep "ingest pipeline")
- [x] ISC-144: `kernel/AssertionEngine.md` defines `ai_tells_absent`, `personality_present`, `suggestion_approved`, and `ingest_preserved` with proxies and diagnostics (lint: assertion catalog)
- [x] ISC-145: `bin/essayos.mjs assert` runs `ai_tells` and `sentence_variance` as mechanical proxies; `tests/fixtures/ai-sounding` trips exactly those two and `clean` passes all five (npm test)
- [x] ISC-146: schemas and templates exist for `IngestReport`; `EssayState.mode`, `Drafts.origin/self_authored/ingested_hash`, and `ReviewerFeedback` suggestion decision fields are documented (lint: required files; Read)
- [x] ISC-147: `GrillMe` in ingest mode targets untraceable claims first and never copies the draft into `ExperienceDatabase` (Grep "Ingest mode" in GrillMe)
- [x] ISC-148: `VoiceModel` uses the ingested text as a sample only when `self_authored: true` (Grep "self_authored" in VoiceModel)

### Behavioral evals (2026-09-19)
- [x] ISC-149: `evals/` holds ≥4 cases in the `claude plugin eval` format, each with a prompt and graders of known types (lint: `lintEvals`)
- [x] ISC-150: cases cover: ingest without rewrite + one question; AI tells named by quoting spans; no fabricated detail; unrelated request does not trigger; unknown essay gets no invented status (Read `evals/*/prompt.md`)
- [x] ISC-151: CI runs the eval suite only when `ANTHROPIC_API_KEY` is present, with `--trust-plugin`, a cost cap, pinned models, and uploads `results.json` (Read `.github/workflows/ci.yml`)
- [x] ISC-152: Anti: no eval or lint step is required for the OS to run; the package still works with no Node and no network (Read README "Optional Node tooling")

## Test Strategy

| isc range | type | check | threshold | tool |
|-----------|------|-------|-----------|------|
| 1–10 | existence+content | file present, key phrase grep | 100% | Read / Grep |
| 11–70 | content | required sections + concepts present per file | 100% | Read / Grep |
| 71–92 | schema | front matter + field-name presence | 100% | Read / Grep |
| 93–104 | invariant | documented mechanism present and consistent | 100% | Read / Grep |
| 105–114 | anti | absence of forbidden pattern; presence of guard text | 0 violations | Grep |
| vocabulary | consistency | EssayState/artifact/assertion names identical across files | 0 drift | Grep cross-file |
| 123–138 | packaging | manifests parse, versions agree, pins match, docs plain | 0 errors | `bin/essayos.mjs lint` + `claude plugin validate --strict` |
| 139–148 | content + fixture | ingest skills conform; AI-tell and rhythm proxies isolate the planted defect | 100% | `npm test` |
| 149–152 | behavioral | eval cases score ≥ 0.8 with the plugin loaded | threshold 0.8 | `claude plugin eval` (credentialed CI) |

## Features

| name | description | satisfies | depends_on | parallelizable |
|------|-------------|-----------|------------|----------------|
| core-contracts | README, CONVENTIONS, SKILLS registry, EssayState schema | 1–10,71,96–102 | — | no (coherence-critical) |
| kernel | Orchestrator, AssertionEngine, LearningLayer | 11–21 | core-contracts | no |
| discovery | GrillMe, ApplicantModel, ExperienceGraph, ThemeDiscovery | 22–30 | core-contracts | yes |
| architecture | 5 architecture skills | 31–36 | core-contracts | yes |
| writing | 5 writing skills | 37–43 | core-contracts | yes |
| review-verification | 3 review + 3 verification skills | 44–52 | core-contracts | yes |
| specialists | 6 specialist agents | 53–59 | core-contracts | yes |
| meta | 11 meta skills | 60–70 | core-contracts | yes |
| schemas | 16 artifact schemas + ClaimEvidenceMap | 72–90 | core-contracts | yes |
| templates | blank starters for 16 artifacts | 91–92 | schemas | yes |
| system | Init, Status, Resume | 93–95 | core-contracts, schemas | yes |
| codex-packaging | Codex manifests + skills entry skills | 123–128 | core-contracts | yes |
| third-party-skills | humanizer + simple-english pins, dependencies, skills-sync | 129–138 | codex-packaging | yes |
| ingest-flow | Ingest, ReverseOutline, AITellScan, PersonalizationReview, IngestReport | 139–148 | third-party-skills, schemas | no (coherence-critical) |
| evals | claude plugin eval suite + CI job | 149–152 | ingest-flow | yes |

## Decisions

- 2026-06-23: Markdown protocol is canonical; the zero-dep Node helper is optional. Keeps the package portable and runnable by Claude or Codex while staying as deterministic as possible.
- 2026-06-23: EssayOS is an elicitation + arrangement + verification engine, not a generation engine. The applicant is the sole source of truth for experiences.
- 2026-09-19: the plugin follows the portable Agent Plugins layout (root `plugin.json` + `skills/`) with a `.codex-plugin/plugin.json` overlay, per developers.openai.com/plugins/build/plugins. `commands/` was removed because Claude Code loads `skills/*/SKILL.md` too and would define every command twice; the contract docs moved from `skills/` to the root (`CONVENTIONS.md`, `SKILLS.md`).
- 2026-09-19: humanizer and simple-english are bundled as pinned copies in `skills/` and load in both runtimes from the same files. They were first declared as Claude plugin dependencies; that was reversed the same day (owner decision) because the bundled copies already load in Claude, a dependency duplicated them, disabled a bare `--plugin-dir .` load, and would have installed upstream simple-english's write-time lint hooks. The marketplace keeps both upstreams as optional standalone installs pinned to the same sha; the linter enforces that the pins agree and that no dependency is declared.
- 2026-09-19: simple-english applies to questions, reports, and docs only. It flattens prose by design and would defeat the "human, not monotone" requirement if applied to the essay.
- 2026-09-19: ingest never rewrites unasked. The ingested text is write-once; every change is a suggestion with a recorded applicant decision; an untraceable claim becomes an interview question, never an invented detail.
- 2026-09-19: spec/eval pattern = ISA criteria enforced by the zero-dependency linter and fixtures (always runs) + a `claude plugin eval` suite (runs only with credentials). Lint proves structure; evals prove behavior.
- 2026-06-23: Convergence is a best-draft ratchet + ε-improvement + quality-ceiling gate — this closes both non-convergence (revision churn against a moving target) and corruption (collateral damage to good sections) at once.
- 2026-06-23: ExperienceDatabase / ApplicantModel / VoiceModel are applicant-scoped and reusable across essay types; essay-specific artifacts are not shared. One experience corpus → many essays.
- 2026-06-23: Core contracts (README, CONVENTIONS, EssayState schema, kernel) were authored as one coherent unit before the leaf skills, because cross-file vocabulary drift is the primary risk for a system this size.
- 2026-06-23: An independent design review found the two core invariants (idempotent upsert-by-id + monotonic ratchet) COLLIDE unless reconciled; resolved by encoding quality-join idempotency + per-input-epoch ratchet + denoise/margin + terminal cap + DAG guard into CONVENTIONS §3a-3d and Orchestrator. Fixed in-spec rather than deferred. (ISC-115..122)
- 2026-06-23: agents/ (6 plugin wrappers) intentionally coexist with specialists/ (persona library); each wrapper embodies one persona file rather than duplicating it. Documented in README to disambiguate.
- 2026-06-23: A 45-skill qualitative audit ran across all skills/agents: 41 PASS / 4 minor concerns. Only the ExperienceDatabase↔ExperienceGraph evidence-source semantics warranted a fix (AssertionEngine drift-guard added).

## Changelog

- conjectured: a 7-phase OAPEVL+U loop per skill is enough to make the system feel like an OS.
  refuted by: systems analysis — without a monotonic ratchet the revise loop thrashes/corrupts regardless of loop discipline.
  learned: the "OS feel" is dominated by two state invariants (idempotent upsert-by-id + best-draft ratchet), not by loop ceremony.
  criterion now: ISC-14, ISC-15, ISC-43, ISC-109 added to make the ratchet a hard, tested property.
- conjectured: "idempotent upsert-by-id" + "monotonic best-draft ratchet" are independently sufficient invariants.
  refuted by: an independent design review — they are defined over the same keys and contradict at the boundary (replay clobbers ratchet; monotonic ratchet serves stale-best forever; noisy judge locks a fluke).
  learned: the invariants only compose as `state = (input-epoch, quality-semilattice)` — upsert must be a max-by-quality join, the ratchet must be per-epoch, and unseating needs denoise + an ε margin.
  criterion now: ISC-115..122 added; CONVENTIONS §3a-3d and Orchestrator "Composing the ratchet with idempotency" encode the resolution.
- conjectured: the test harness (`bin/essayos.mjs`) actually verified the essay invariants, and the docs could claim convergence is "provable / verifiable in CI".
  refuted by: a multi-agent stability + adversarial audit — 2 of 3 `assert` checks parsed field names absent from the templates (so they passed broken essays), `assert` exited 0 on missing input, and "provable / verifiable in CI" was unbacked by code.
  learned: the harness is a structural linter plus a few field checks, not a proof checker; the ratchet/epoch invariants are agent-upheld. Claims were downgraded to match reality.
  criterion now: asserts rewritten to parse the real table columns; missing-input exits non-zero; clean/broken `tests/fixtures/` gate CI (broken trips all three checks); README "What the tooling checks" honesty box added; symlink-escape hardened with realpath containment.

## Verification

- ISC (structure, 1–104): `node bin/essayos.mjs lint` → "EssayOS lint: PASS (0 errors, 0 warnings)" — all required files present, all skill front matter + body sections present, all reads/writes reference known artifacts, all assertion refs resolve.
- ISC (runtime): smoke test — copied templates → `artifacts/smoke/`, `essayos state smoke` parsed EssayState (phase init, 17 missing), `essayos assert smoke` ran word_budget/theme_supported/claim_traceable mechanically. End-to-end loop proven.
- ISC (105–114 anti): lint guard checks pass (README "not a generation engine", IncrementalWriter "one section", CONVENTIONS one-question, ThemeDiscovery ≥2); qualitative audit confirmed one-section/one-question/≥2-themes/localized-revision/ratchet honored across skills.
- ISC (115–122 invariant composition): encoded in CONVENTIONS §3a-3d + Orchestrator "Composing the ratchet with idempotency"; verified by Read of both files post-edit.
- Audit: 45-skill qualitative audit (41 PASS / 4 minor); independent design review (surfaced + resolved the invariant-composition flaw); cross-model adversarial audit (read-only; flags triaged as by-design).
