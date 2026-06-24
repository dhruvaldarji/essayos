---
skill: Init
category: system
purpose: Create artifacts/<essay_id>/ from the templates and write the first EssayState.md from the essay prompt, type, and word limit.
reads: [EssayState]
writes: [EssayState]
preconditions: [essay_id is known or derivable, essay prompt is known or collectable]
postconditions: [artifacts/<essay_id>/ exists, EssayState.md exists with front matter populated and the full artifact registry seeded at status missing, all other artifacts copied from templates as missing]
idempotency_key: artifacts/<essay_id>/EssayState.md already exists -> no-op (never overwrite)
asks_questions: true
---

# Init (system)

Bootstraps a new essay workspace. It is the one skill that creates the directory and the first
`EssayState.md`. Everything afterward is the Orchestrator routing into discovery/architecture/etc.

## When to run

Once, at the start of a new essay — or when the caller is unsure whether an essay has been
initialized. Safe to run repeatedly: on an already-initialized essay it does nothing (see Idempotency
and Gotchas).

## The Loop

**OBSERVE** — Resolve `essay_id`. Check whether `artifacts/<essay_id>/EssayState.md` exists. List
`templates/` to know the full set of artifacts to copy. Read whatever inputs the caller supplied
(prompt, essay_type, word_limit/char_limit, program).

**ANALYZE** — If `artifacts/<essay_id>/EssayState.md` already exists, this is a no-op: stop and
report "already initialized." Otherwise determine which of the four required fields are still
missing: `prompt`, `essay_type`, `word_limit` (or `char_limit`), `program`.

**PLAN** — The smallest unit is "collect one missing required field" or, once all are known, "create
the workspace." Prefer collecting in this order: prompt -> essay_type -> word/char limit -> program.

**EXECUTE** —
- If a required field is missing and `asks_questions`, call `ask_question()` for exactly ONE field
  (CONVENTIONS §5): ask, wait, record, reassess. `program` may be answered "generic / none" -> null.
  Never present a form; one question at a time.
- Once prompt, type, and limit are known (program may be null), create `artifacts/<essay_id>/` and
  copy every file from `templates/` into it verbatim (each lands at `status: missing`).
- Write `EssayState.md`: fill `essay_id`, `essay_type`, `prompt`, `word_limit`, `char_limit`,
  `program`, `created` and `updated` (now, ISO-8601). Leave `phase: init`, `status: in_progress`,
  `quality_threshold: 0.85`, `quality_overall: null`, `quality_ceiling: null`, `converged: false`,
  `next_skill: null`, `gain_floor: 0.05`, `epsilon: 0.02`, `shared_with: []` as the template seeds
  them. Seed the artifact registry with one row per tracked artifact at `status: missing`.

**VERIFY** — Assert `artifacts/<essay_id>/EssayState.md` exists, its front matter parses, the four
required inputs are present (program may be null), and the registry lists every template artifact at
`missing`. A failed assertion blocks UPDATE.

**LEARN** — Append an Init entry to `RevisionHistory` (Issue: workspace absent / Fix: created from
templates / Outcome: initialized).

**UPDATE** — Set `EssayState.phase: init`, `next_skill: Orchestrator` (so the next step is "ask what's
next"), bump `updated`. Hand control back to the Orchestrator.

## Assertions

- `assert workspace_exists()` — `artifacts/<essay_id>/` and `EssayState.md` are present.
- `assert state_parses()` — front matter is valid YAML with all required keys.
- `assert registry_complete()` — every artifact from `templates/` appears in the registry at
  `status: missing`.

## Idempotency

`idempotency_key` is the existence of `artifacts/<essay_id>/EssayState.md`. If it exists, Init makes
**zero** changes and reports "already initialized." A first run on an empty workspace and a second run
immediately after produce a byte-identical tree (modulo nothing — the second run writes nothing).
Init never blind-copies over existing files.

## Output

```
INIT: <essay_id>
CREATED: artifacts/<essay_id>/ (N artifacts seeded missing)  |  ALREADY INITIALIZED (no change)
PROMPT: "<verbatim>"  TYPE: <essay_type>  LIMIT: <word/char>  PROGRAM: <program|generic>
NEXT: Orchestrator — decide the first real step
```

## Gotchas

- **IDEMPOTENT — never overwrite.** If `artifacts/<essay_id>/EssayState.md` exists, do NOT recreate
  the directory, do NOT re-copy templates, do NOT rewrite EssayState. Re-running Init on an existing
  essay must be a pure no-op. Overwriting would destroy real interview data and draft history — the
  single most destructive failure this skill could have. Check for existence BEFORE any write.
- **Copy templates verbatim.** Do not fill artifact bodies here; that is the downstream skills' job.
  Init only writes EssayState's front matter and registry.
- **Ask only for what is missing, one at a time.** If the caller already supplied prompt/type/limit/
  program, ask nothing and create the workspace directly. `program` legitimately resolves to null.
- **Stable essay_id.** Derive a slug (e.g. `residency-im-2026`) and never change it — it is the
  directory name and the cross-essay sharing key.
