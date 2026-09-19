# Changelog

All notable changes to EssayOS are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-09-19

### Added

- **Ingest flow**: `system/Ingest`, `architecture/ReverseOutline`, `review/AITellScan`, and
  `review/PersonalizationReview`, with the `essay-ingest` and `essay-scan` commands. An essay the applicant already
  wrote is stored verbatim, cut into sections, claim-mapped, grounded by a targeted interview, scanned
  for AI tells and monotone prose, and revised one applicant-approved suggestion at a time under
  the ratchet. New artifact `IngestReport`; new fields `EssayState.mode`, `Drafts.origin`,
  `Drafts.self_authored`, `Drafts.ingested_hash`, and suggestion decisions in `ReviewerFeedback`.
- **Assertions**: `ai_tells_absent`, `personality_present`, `suggestion_approved`,
  `ingest_preserved`, with mechanical proxies `ai_tells` and `sentence_variance` in the inspector.
- **Portable packaging**: root `plugin.json` (Agent Plugins 1.0.0), `.codex-plugin/plugin.json`
  overlay, `.agents/plugins/marketplace.json`, and entry skills in `skills/` (Agent Skills format)
  that serve Claude Code and Codex from one set of files. `commands/` is gone; the contract docs
  moved to `CONVENTIONS.md` and `SKILLS.md` at the root.
- **Third-party skills**: humanizer 3.0.0 and simple-english 2.1.0 bundled as pinned copies in
  `skills/` (loaded by Claude Code and Codex alike), recorded in `skills/VENDORED.json`, checked by
  `node bin/essayos.mjs skills-sync`, and also listed in the marketplace as optional standalone
  installs pinned to the same commit.
- **Spec and evals**: ISA criteria ISC-123 onward, linter checks for manifests, vendored versions,
  eval-suite shape, and plain-English docs, a `tests/fixtures/ai-sounding` fixture, and an `evals/`
  suite in the `claude plugin eval` format with a credential-gated CI job.

### Changed

- Interview questions and applicant-facing reports follow the simple-english Plain rules
  (`CONVENTIONS.md` §5a, §9). The essay prose is exempt by contract.
- `IncrementalWriter` and `RevisionLoop` run a humanizer pass with the `VoiceModel` samples as the
  writing sample before storing prose, and check `ai_tells_absent` and `personality_present`.
- README, AGENTS.md, CONTRIBUTING.md, and the command text were rewritten in plain English.

## [1.0.0] - 2026-06-23

### Added

- Initial release of EssayOS, an idempotent, stateful, agentic operating system for writing
  application essays (college admissions, scholarships, graduate school statements, fellowships,
  grants, and more).
- **Kernel**: Orchestrator (scheduler + convergence), AssertionEngine (named quality + system
  assertions), LearningLayer (revision history and lessons).
- **Skills**: 39 skills across discovery, architecture, writing, review, verification, and meta
  categories, all obeying one universal contract (`CONVENTIONS.md`).
- **Specialists**: 6 reviewer-persona agents, also registered as Claude-plugin agents.
- **Schemas + templates**: 18 machine-readable artifact schemas and matching blank templates.
- **Plugin packaging**: `.claude-plugin/plugin.json`, slash commands, and `AGENTS.md` for Codex.
- **Test harness**: zero-dependency Node inspector (`bin/essayos.mjs`) with `lint`, `state`, and
  `assert` subcommands.

### Design

- Core invariants: quality-aware idempotent artifacts (upsert-by-id, staleness propagation, per-input
  epoch) and a monotonic best-draft ratchet (median-of-k denoise + ε-margin + ceiling gate + terminal
  cap).
