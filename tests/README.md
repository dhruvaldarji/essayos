# EssayOS tests

EssayOS is testable at two levels.

## 1. Package self-test (contract lint)

Verifies the package is internally consistent — the contracts in `skills/CONVENTIONS.md` actually hold
across every skill, schema, and kernel file.

```
node bin/essayos.mjs lint        # structural lint only (same as: npm run lint)
npm test                         # lint + fixture assertions (the full self-test)
```

Checks performed:

- **Structure** — every file the `ISA.md` requires exists.
- **Skill front matter** — each skill declares `skill, category, purpose, reads, writes,
  preconditions, postconditions, idempotency_key, asks_questions`.
- **Skill body** — each skill has `When to run / The Loop / Assertions / Idempotency / Output /
  Gotchas` (specialists use the agent body shape).
- **Vocabulary** — every artifact named in a `reads`/`writes` has a schema in `schemas/`.
- **Assertions** — every `assert_name` referenced by a skill exists in `kernel/AssertionEngine.md`.
- **Guard phrasing** — required guard text is *present* (e.g. README says "not a generation engine",
  IncrementalWriter says "one section"). These are emitted as warnings, not hard errors.

Exit code is non-zero on any violation, so it works in CI.

## 2. Runtime state inspection

For a live essay, the inspector reads the on-disk artifacts and reports status deterministically —
the same view a human or agent gets, but mechanical.

```
node bin/essayos.mjs state <essay_id>     # phase, artifact statuses, quality vs threshold/ceiling
node bin/essayos.mjs assert <essay_id>    # run the mechanically-checkable assertions (word_budget, theme_supported, claim_traceable, ...)
```

Both are pure functions of the files on disk — running them twice changes nothing. This is the same
idempotency the skills rely on.

## Portability note

The harness is Node stdlib only (no `node_modules`). The OS itself needs no runtime at all — an agent
following the Markdown executes it directly. The harness exists so the package is self-tested in CI
(structural lint + field-level fixture assertions) and so state inspection is deterministic. It checks
structure and a few field properties — it is not a proof checker for the ratchet/epoch invariants,
which the agent upholds at runtime.
