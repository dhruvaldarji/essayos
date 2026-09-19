# EssayOS tests

EssayOS is testable at three levels.

## 1. Package self-test (contract lint)

Verifies the package is internally consistent. The contracts in `CONVENTIONS.md` must hold
across every skill, schema, kernel file, and manifest.

```
node bin/essayos.mjs lint        # structural lint only (same as: npm run lint)
npm test                         # lint + fixture assertions (the full self-test)
```

Checks performed:

- **Structure**: every file the `ISA.md` requires exists.
- **Skill front matter**: each skill declares `skill, category, purpose, reads, writes,
  preconditions, postconditions, idempotency_key, asks_questions`.
- **Skill body**: each skill has `When to run / The Loop / Assertions / Idempotency / Output /
  Gotchas` (specialists use the agent body shape).
- **Vocabulary**: every artifact named in a `reads`/`writes` has a schema in `schemas/`.
- **Assertions**: every `assert_name` referenced by a skill exists in `kernel/AssertionEngine.md`.
- **Manifests**: `package.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, and
  `.codex-plugin/plugin.json` parse and agree on the version. Claude dependencies resolve to
  marketplace entries pinned to a commit sha. The Codex `skills` path exists and every skill
  directory has a `SKILL.md` whose `name` matches the directory.
- **Vendored skills**: every skill in `skills/VENDORED.json` is present with its LICENSE, and
  its `SKILL.md` version and the marketplace pin match the recorded version and sha.
- **Eval suite shape**: `evals/` has at least four cases, each with a prompt and graders of known
  types. This checks the files, not the behavior.
- **Plain English**: README, AGENTS.md, CONTRIBUTING.md, the commands, and the entry skills have no
  em-dash or semicolon in prose and no sentence over 25 words.
- **Guard phrasing**: required guard text is present (warnings, not errors).

Exit code is non-zero on any violation, so it works in CI.

## 2. Runtime state inspection

For a live essay, the inspector reads the on-disk artifacts and reports status deterministically.

```
node bin/essayos.mjs state <essay_id>     # mode, phase, artifact statuses, quality vs threshold/ceiling
node bin/essayos.mjs assert <essay_id>    # mechanically-checkable assertions (see below)
```

`assert` runs five checks on the `best/` draft and the artifact tables:

| check | proxy for | fails when |
|-------|-----------|------------|
| `word_budget` | `assert word_budget()` | the draft exceeds `Requirements.word_limit` |
| `theme_supported` | `assert theme_supported()` | a theme row lists fewer than 2 experiences |
| `claim_traceable` | `assert claim_traceable()` | a claim row is unsupported |
| `ai_tells` | `assert ai_tells_absent()` | any strong humanizer tell (§1–§5), or 3+ stock words |
| `sentence_variance` | `assert personality_present()` (rhythm half) | sentence-length stdev under 4 words, or 4+ sentences in a row with the same opener |

`sentence_variance` reports `SKIP` for a draft under four sentences. The fixtures prove the checks
isolate what they claim: `clean` passes all five, `broken` trips the first three, and `ai-sounding`
trips exactly the last two.

Both commands are pure functions of the files on disk. Running them twice changes nothing.

## 3. Behavioral evals (`claude plugin eval`)

`evals/` holds the behavioral spec in the [Claude Code plugin eval](https://code.claude.com/docs/en/plugin-evals)
format: one directory per case with a `prompt.md` and `graders/*.md`. The cases check that the
plugin ingests an existing essay without rewriting it, asks one question at a time, names AI tells
by quoting them, refuses to invent details, does not report a status for an essay that does not
exist, and stays out of the way on unrelated requests.

```
claude plugin eval . --trust-plugin --ablation none --allow-tools Write Edit --max-cost-usd 5
```

Each case lists the plugin and its two vendored dependency plugins in its `plugins` field. Without
them, Claude Code disables `essayos` for unsatisfied dependencies and every skill grader fails.

Every run and every `llm` grader is a model call on your credentials. CI runs the suite only when
`ANTHROPIC_API_KEY` is set, under a cost cap, and uploads `results.json`.

## Portability note

The harness is Node stdlib only (no `node_modules`). The OS itself needs no runtime at all. An agent
following the Markdown executes it directly. `skills-sync` is the only subcommand that uses the
network, and only maintainers run it. The lint and the fixture checks prove structure and a few
field properties. They are not a proof checker for the ratchet or epoch invariants, which the agent
upholds at runtime.
