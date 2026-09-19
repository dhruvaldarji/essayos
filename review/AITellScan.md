---
skill: AITellScan
category: review
purpose: Find every passage of the draft that reads like a language model wrote it — using the humanizer pattern catalog — and every passage that is flat or monotone, and record each as a located finding without rewriting anything.
reads: [Drafts, VoiceModel, LessonsLearned]
writes: [ReviewerFeedback, IngestReport]
preconditions: [Drafts has a complete draft (best/ or draft-ingested), VoiceModel exists]
postconditions: [ReviewerFeedback has one located finding per AI tell and per monotone section, each naming the pattern and a repair direction; IngestReport counts are current in mode ingest]
idempotency_key: findings upserted by stable id (hash of section + span + pattern); re-run on unchanged Drafts + VoiceModel is a no-op
asks_questions: false
---

# AITellScan (review)

The detector. It reads the draft the way a reader who has seen a thousand model-written essays does
and marks the tells: the not-X-but-Y contrast, the one-line closer after every paragraph, the forced
triad, the "testament to," the paragraph where every sentence is fourteen words long. Its catalog is
the `humanizer` skill (see CONVENTIONS §10): patterns §1–§5 are strong enough to act on alone;
§6–§18 need company. It also checks the opposite failure, prose that is *correct* but dry: no
reaction, no opinion, no sensory detail, no variation. It flags; the repair belongs to
`PersonalizationReview` (ingest) or `RevisionLoop` (compose), always in the applicant's voice.

## When to run

In ingest mode: after `VoiceModel` exists, before `AuthenticityAuditor`, and again whenever `Drafts`
changes. In compose mode: after each `IncrementalWriter` section and after each accepted revision.
Any time `assert ai_tells_absent()` or `assert personality_present()` must be evaluated, this skill
is what evaluates it.

## The Loop

**OBSERVE** — Read `Drafts.md` (the draft under review: `draft-ingested` before any revision, else
`best/`), `VoiceModel.md` (the applicant's real habits, which can *license* a pattern: if the
applicant genuinely writes in dashes, dashes are not a tell), and `LessonsLearned` for prior rules.
Load the humanizer catalog: the `humanizer` skill bundled with this plugin, or read
`skills/humanizer/SKILL.md` directly.

**ANALYZE** — Two passes over every section.
1. **Tell pass.** Walk the catalog strongest first. For each hit record the section, the verbatim span,
   the pattern number and name, and its strength (`strong` for §1–§5, `weak` otherwise). A weak hit
   counts only when ≥2 weak hits land in the same section or a strong hit is present. A pattern the
   `VoiceModel` shows the applicant using at a similar rate is *not* a hit; record it as `licensed`.
2. **Personality pass.** Per section, check: at least one sentence carries the applicant's own
   reaction, opinion, or a specific sensory detail; sentence lengths vary (standard deviation ≥ 4 words
   over ≥ 4 sentences); no run of 4+ sentences opening with the same word; the section is not entirely
   summary. A section that fails is `monotone`.

**PLAN** — Record *all* findings in one run (the scan is cheap and deterministic), ranked: strong
tells → monotone sections → weak-tell clusters.

**EXECUTE** — Upsert each finding into `ReviewerFeedback` under reviewer `ai-tell-scan` with
`dimension: ai-tell | monotone`, the span, the pattern, and a **direction** for repair, never the
rewrite (e.g. "§1 not-X-but-Y: state the positive half; ask what the applicant actually saw"). In
ingest mode, update `IngestReport` counts (`ai_tells_strong`, `ai_tells_weak`, `monotone_sections`)
and each passage's `verdict` (`revise` for tells/monotone; leave `keep`/`ground` to the other
reviewers).

**VERIFY** — Run the assertions below via `kernel/AssertionEngine`. The mechanical proxy
(`node bin/essayos.mjs assert <id>`: `ai_tells`, `sentence_variance`) must agree with the strong-tell
count; a disagreement is a finding about the scan, recorded in `RevisionHistory`.

**LEARN** — Append a `RevisionHistory` entry per strong tell. If the same pattern recurs across
sections, promote a `LessonsLearned` rule ("this draft closes every paragraph with a summary line").

**UPDATE** — Upsert `ReviewerFeedback` (and `IngestReport`), recompute hashes, set `source_hashes` to
the current Drafts + VoiceModel hashes, update the EssayState rows, bump `updated`. Hand back to the
Orchestrator.

## Assertions

- `assert ai_tells_absent()` — zero strong tells and no weak-tell cluster in any section, after
  VoiceModel licensing. On fail, the diagnostic quotes the span and names the pattern number.
- `assert personality_present(section)` — the section has a reaction/opinion/sensory sentence and
  varied sentence length. On fail, the diagnostic says which half failed ("no reaction or detail" or
  "monotone: 6 sentences, all 13–15 words").
- `assert voice_consistent()` — the licensing step used the VoiceModel honestly: no pattern was
  excused without a quoted applicant sample at a similar rate.

## Idempotency

Pure evaluation. Each finding's id is the hash of `section + span + pattern`, so re-scanning an
unchanged draft replaces findings in place and adds nothing. When the draft changes, only sections
whose hash changed are re-scanned; findings on unchanged sections are preserved; findings whose spans
disappeared are marked `resolved`, never deleted.

## Output

```
AI-TELL SCAN: <s> strong · <w> weak (<c> clustered) · <l> licensed by VoiceModel
MONOTONE: <m> of <n> sections
TOP: <section> — "<span>" — §<n> <pattern name>
ASSERTIONS: ai_tells_absent <p|f> · personality_present <p|f> · voice_consistent <p|f>
NEXT: PersonalizationReview (ingest) | RevisionLoop (compose) | AuthenticityAuditor (clean)
```

## Gotchas

- **Flag, never fix.** Rewriting here bypasses the applicant's decision and the ratchet.
- **The VoiceModel can license a pattern; a hunch cannot.** "They probably write like that" is not a
  quoted sample. Excuse a pattern only against evidence.
- **Dry is a failure too.** A draft with zero tells that reads like a report has failed
  `personality_present`. Monotone is the quieter way to sound like a model.
- **Do not act on one weak tell.** A single triad or a single dash is how people write. Two weak tells
  in a paragraph, or one strong tell, is the bar.
- **Use the fixed catalog.** The pattern list is the vendored humanizer version recorded in
  `skills/VENDORED.json`; a runtime-invented list makes verdicts unreproducible.
