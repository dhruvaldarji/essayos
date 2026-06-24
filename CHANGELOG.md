# Changelog

All notable changes to EssayOS are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-06-23

### Added

- Initial release of EssayOS, an idempotent, stateful, agentic operating system for writing
  application essays (college admissions, scholarships, graduate school statements, fellowships,
  grants, and more).
- **Kernel**: Orchestrator (scheduler + convergence), AssertionEngine (named quality + system
  assertions), LearningLayer (revision history and lessons).
- **Skills**: 39 skills across discovery, architecture, writing, review, verification, and meta
  categories, all obeying one universal contract (`skills/CONVENTIONS.md`).
- **Specialists**: 6 reviewer-persona agents, also registered as Claude-plugin agents.
- **Schemas + templates**: 18 machine-readable artifact schemas and matching blank templates.
- **Plugin packaging**: `.claude-plugin/plugin.json`, slash commands, and `AGENTS.md` for Codex.
- **Test harness**: zero-dependency Node inspector (`bin/essayos.mjs`) with `lint`, `state`, and
  `assert` subcommands.

### Design

- Core invariants: quality-aware idempotent artifacts (upsert-by-id, staleness propagation, per-input
  epoch) and a monotonic best-draft ratchet (median-of-k denoise + ε-margin + ceiling gate + terminal
  cap).
