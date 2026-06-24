---
skill: ThemeDiscovery
category: discovery
purpose: Infer evidenced themes from the ExperienceGraph, asserting a theme only when >=2 distinct experiences support it.
reads: [ExperienceGraph]
writes: [ThemeGraph]
preconditions: [ExperienceGraph exists with nodes and edges]
postconditions: [every ThemeGraph theme is supported by >=2 distinct experiences (theme_supported passes); no adjective-label themes]
idempotency_key: each theme upserted by stable id with its supporting experience ids; source_hashes track ExperienceGraph; re-run on unchanged input is a no-op
asks_questions: false
---

# ThemeDiscovery (discovery)

The pattern-finder. It reads the `ExperienceGraph` and surfaces the **themes** — the recurring,
evidenced threads that will become the essay's spine. A theme is a *pattern across experiences*, not a
label for the applicant. It is the last Discovery step before architecture, and it is strict on
purpose: a theme exists **only if ≥2 distinct experiences support it**, and **adjective labels are
forbidden**. This is the gate that stops "compassionate, hardworking, resilient" essays.

## When to run

After `ExperienceGraph` has nodes and edges, or whenever `ThemeGraph` is `missing`/`thin`/`stale`.
Stale the moment `ExperienceGraph`'s hash diverges from the recorded `source_hashes` — adding one
experience can promote a 1-experience hypothesis into a real 2-experience theme, or invalidate one.

## The Loop

**OBSERVE** — Read `ExperienceGraph.md` (nodes, their facet-7 candidate themes, and especially
`shares-theme` / `growth-arc` edges) and the existing `ThemeGraph.md`. Capture the current
`ExperienceGraph` hash.

**ANALYZE** — Cluster candidate threads across nodes. Count, for each candidate, the number of
**distinct** experiences whose facets genuinely express it. A `shares-theme` edge is a hint, not proof
— confirm the thread is actually present in both nodes' facets. Classify each candidate: `supported`
(≥2 distinct experiences), `tentative` (exactly 1), `rejected` (adjective-label or no real pattern).

**PLAN** — Smallest unit: promote/define **one** supported theme, or revise one stale theme. One per
pass.

**EXECUTE** — Write the theme as an **evidenced pattern**, phrased as a recurring behavior/stance, not
a trait word. Each theme records: a pattern statement, the ≥2 supporting experience node ids, and the
facets in each node that express it. Forbidden form: single adjectives or virtue-labels
("hardworking", "compassionate", "dedicated", "resilient") — these describe a person, not a pattern,
and are unfalsifiable. Required form: a thread the experiences *demonstrate* (e.g. "repeatedly steps
into the gap others avoid — the unclaimed task, the awkward conversation, the failing handoff"). Link
themes to each other in the `ThemeGraph` where one subsumes, opposes, or builds on another.

**VERIFY** — Run `assert theme_supported(theme)` for **every** theme written. It counts
`ExperienceGraph` nodes linked to the theme and passes only at ≥2 distinct experiences; on failure the
diagnostic names the theme and its count ("only 1"), and the theme is demoted to `tentative` (held,
not asserted) rather than published. A failed assertion blocks UPDATE of that theme.

**LEARN** — Append a `RevisionHistory` entry for any candidate rejected as an adjective-label or
demoted for thin support (Issue = the diagnostic). If a reusable detection rule emerged (e.g. "this
applicant's strongest theme only appears once two failure scenes are compared"), append to
`LessonsLearned`.

**UPDATE** — Upsert each supported theme into `ThemeGraph` by stable `id` (pattern slug, e.g.
`thm-steps-into-the-gap`) with its supporting experience ids and inter-theme links. Recompute `hash`,
set `source_hashes: [exg:<ExperienceGraph hash>]`, set the `EssayState` row `last_skill:
ThemeDiscovery`, bump `updated`. When the supported themes are stable, set `next_skill:
NarrativeArchitecture` (Discovery complete).

## Assertions

- `assert theme_supported(theme)` — the theme is backed by **≥2 distinct** experiences (counted over
  `ExperienceGraph` nodes linked to it). The single hard gate of this skill; nothing publishes without
  it.

## Idempotency

Each theme is upserted by stable `id` with its supporting experience ids. The artifact records
`source_hashes: [exg:<hash>]`; if it still matches on OBSERVE, the themes are current — skip and
report "no change." If `ExperienceGraph` changed, recount support: a theme can be promoted (1→2),
held (still ≥2), or demoted (dropped below 2 → moves to tentative). Identical input yields a
byte-identical `ThemeGraph` modulo `updated`.

## Output

```
THEMES: <k> supported (>=2 exp) · <t> tentative (1 exp, held) · <r> rejected (adjective/no pattern)
SUPPORT: every published theme — theme_supported: pass (each lists its >=2 experience ids)
CHANGED: <promoted/demoted themes vs prior run, or none>
NEXT: NarrativeArchitecture (themes stable) | GrillMe (need a 2nd experience to support a tentative theme)
```

## Gotchas

- **Two experiences or it is not a theme.** One supporting experience is a moment, not a pattern. Hold
  it as `tentative` and let `GrillMe` decide whether a second scene exists — never publish a
  1-experience theme.
- **No adjectives. Ever.** "Compassionate" is a label the reader must take on faith; "sits down,
  every time, even when the floor is slammed" is a pattern the experiences prove. Reject the former,
  write the latter.
- **`shares-theme` edges are hints, not proof.** Confirm the thread actually lives in both nodes'
  facets before counting them; a mislabeled edge can fake support.
- **Re-count on staleness.** When the graph changes, a theme's support can drop below 2 — demote it
  honestly rather than letting a now-unsupported theme survive into architecture.
