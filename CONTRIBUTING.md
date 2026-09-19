# Contributing to EssayOS

Thanks for your interest in improving EssayOS. It is a portable Markdown + YAML package. There is no
build step and no runtime dependency, so contributing is mostly editing Markdown and keeping the
contracts consistent.

## Ground rules

EssayOS has one universal contract: [`skills/CONVENTIONS.md`](skills/CONVENTIONS.md). Every skill
obeys it. Before changing anything, read that file and the [`ISA.md`](ISA.md) (the package's own
spec and test harness).

The invariants that must never be broken:

- **Elicit, never fabricate.** Skills work from the applicant's real experiences only.
- **One question at a time.** Interview skills use the `ask_question()` protocol. Never batch.
- **One unit of work per run.** Write one section at a time. Never generate a whole essay in one
  pass.
- **Idempotent, quality-aware state.** Upsert by id. Scored artifacts merge max-by-quality. The
  ratchet is monotonic within an input epoch.
- **The applicant decides.** In ingest mode, a change is applied only after an explicit accept or
  edit, and the original text is never touched.
- **Human, not scientific, prose.** Science shapes the process. The essay must read like a person
  wrote it, and not like a model.

## Before you open a PR

1. Run the self-test: `npm test` (Node ≥ 18). It must report `PASS`.
2. If you added or changed an artifact, update its `schemas/` file and `templates/` starter
   together.
3. If you added a skill, register it in [`skills/SKILLS.md`](skills/SKILLS.md). Make sure its
   `reads` and `writes` reference artifacts that have schemas. Make sure its assertions exist in
   `kernel/AssertionEngine.md`. The linter checks all of this.
4. If you changed behavior the applicant can see, add or update an eval case under `evals/`. See
   [`tests/README.md`](tests/README.md).
5. Keep skill files lean and high-signal. Every `## Gotchas` entry must capture a real failure mode.
6. Keep the user-facing docs in plain English. The linter rejects em-dashes, semicolons, and
   sentences over 25 words in README, AGENTS.md, this file, the commands, and the entry skills.

## Adding a skill

Copy the front-matter and body shape from any existing skill. See `kernel/Orchestrator.md` for the
kernel shape, or `discovery/GrillMe.md` for a pipeline skill. Run the linter. It will tell you what
is missing.

## Testing a checkout in Claude Code

Load the plugin together with its two dependencies. Each vendored skill under `agent-skills/` is
also a minimal Claude plugin for this purpose:

```bash
claude --plugin-dir . --plugin-dir agent-skills/humanizer --plugin-dir agent-skills/simple-english
```

If you load only `.`, Claude Code reports the dependencies as missing and disables the plugin. The
eval cases list all three directories in their `plugins` field for the same reason.

## Updating the pinned third-party skills

`humanizer` and `simple-english` are pinned by version and commit in `agent-skills/VENDORED.json`
and in `.claude-plugin/marketplace.json`. Run `node bin/essayos.mjs skills-sync` to compare the
vendored copies with upstream. Run it with `--update` to pull the newest upstream version into both
places. Review the diff, run `npm test`, and mention the new version in `CHANGELOG.md`.

## Style

Plain Markdown, no HTML. Terse and concrete over verbose. Match the tone of the surrounding files.
