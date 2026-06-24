# Contributing to EssayOS

Thanks for your interest in improving EssayOS. It is a portable Markdown + YAML package, there is no
build step and no runtime dependency, so contributing is mostly editing Markdown and keeping the
contracts consistent.

## Ground rules

EssayOS has one universal contract: [`skills/CONVENTIONS.md`](skills/CONVENTIONS.md). Every skill obeys
it. Before changing anything, read that file and the [`ISA.md`](ISA.md) (the package's own spec and test
harness).

The invariants that must never be broken:

- **Elicit, never fabricate.** Skills work from the applicant's real experiences only.
- **One question at a time.** Interview skills use the `ask_question()` protocol; never batch.
- **One unit of work per run.** Write one section at a time; never generate a whole essay in one pass.
- **Idempotent, quality-aware state.** Upsert by id; scored artifacts merge max-by-quality; the ratchet
  is monotonic within an input epoch.
- **Human, not scientific, prose.** Science shapes the process; the essay must read like a person wrote
  it.

## Before you open a PR

1. Run the self-test: `node bin/essayos.mjs lint` (Node ≥ 18). It must report `PASS`.
2. If you added or changed an artifact, update its `schemas/` file and `templates/` starter together.
3. If you added a skill, register it in [`skills/SKILLS.md`](skills/SKILLS.md) and make sure its
   `reads`/`writes` reference artifacts that have schemas and its assertions exist in
   `kernel/AssertionEngine.md` (the linter checks all of this).
4. Keep skill files lean and high-signal. Every `## Gotchas` entry should capture a real failure mode.

## Adding a skill

Copy the front-matter and body shape from any existing skill (see `kernel/Orchestrator.md` for the
kernel shape, or `discovery/GrillMe.md` for a pipeline skill). Run the linter; it will tell you what is
missing.

## Style

Plain Markdown, no HTML. Terse and concrete over verbose. Match the tone of the surrounding files.
