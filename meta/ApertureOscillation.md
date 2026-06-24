---
skill: ApertureOscillation
category: meta
purpose: Alternate macro and micro views of the essay — essay → section → paragraph → sentence → word and back — to surface defects that are invisible at any single zoom level.
reads: [EssayState, Drafts, Outline, SectionSpecifications, MessageMap, VoiceModel]
writes: [ReviewerFeedback]
preconditions: [Drafts has a working draft]
postconditions: [ReviewerFeedback holds an oscillation block listing each zoom-mismatch defect, located at the level it surfaced]
idempotency_key: each defect upserted by stable id (zoom_level + section + span); re-run on unchanged Drafts + Outline + MessageMap is a no-op
asks_questions: false
---

# ApertureOscillation (meta)

Some defects only exist at one zoom level and are invisible at every other. A draft can be flawless
sentence by sentence and still have no arc (a macro defect); it can have a perfect arc and a single dead
word killing a key line (a micro defect). Reading at one fixed zoom guarantees you miss the others. This
skill deliberately oscillates — essay → section → paragraph → sentence → word, then back up — holding the
**same essay** constant while sweeping the aperture. Defects surface at the transitions: where the macro
promise isn't kept by the micro, or a micro choice betrays the macro intent. It flags; it never rewrites.

## When to run

On any complete draft before Verification, and whenever a score is stuck with no obvious single cause —
that pattern often means a cross-zoom mismatch (the parts are fine, the relationship between levels is
not). Re-run after revision rounds. Re-run when `Drafts`, `Outline`, or `MessageMap` changes.

## The zoom ladder

| Level | What you read for at this aperture |
|-------|-----------------------------------|
| **Essay** | does the whole answer the prompt and land one message? is there a real arc? |
| **Section** | does each section earn its place and advance the message? do they cohere? |
| **Paragraph** | does each paragraph do one job? is the order load-bearing? |
| **Sentence** | does each sentence carry weight? rhythm, clarity, voice? |
| **Word** | is the exact word the right word? dead words, hedges, clichés? |

The oscillation is the method: descend the ladder, then ascend it, then descend again. A defect found
descending (the macro promised X) is confirmed or denied ascending (does the micro deliver X?).

## The Loop

**OBSERVE** — Read `EssayState.md`, `Drafts.md` (working draft), `Outline.md`, `SectionSpecifications.md`,
`MessageMap.md`, and `VoiceModel.md`. Read `LessonsLearned` for cross-zoom defects already turned into
rules.

**ANALYZE** — Determine staleness against Drafts + Outline + MessageMap. If unchanged, the oscillation
stands — skip. Otherwise, identify which sections changed; oscillation re-runs over those plus the
essay-level view (a local change can break a global promise).

**PLAN** — Choose the next pass: one descent or one ascent of the ladder over the in-scope material. One
pass per loop.

**EXECUTE** — Sweep the aperture for that pass. At each level, hold the essay's intent constant and ask
whether this zoom keeps the promise the adjacent zoom made. Record each **mismatch** as a located defect,
tagged with the zoom level at which it surfaced and the level it betrays (e.g. "word-level hedge undercuts
the section's claim of conviction").

**VERIFY** — Run the assertions below via `kernel/AssertionEngine`. Every defect must be located at a
specific level and span; an unlocated or single-level "it just feels off" note is rejected.

**LEARN** — Append a `RevisionHistory` entry per cross-zoom defect (Issue / Cause / Fix direction / Outcome
pending). A recurring mismatch pattern (macro promise routinely undercut at the word level) becomes a
`LessonsLearned` rule.

**UPDATE** — Upsert each defect into the `ReviewerFeedback` oscillation block by stable id (zoom_level +
section + span). Recompute `hash`, set `source_hashes`, update the `EssayState` row, bump `updated`.

## Assertions

- `assert opening_resolves()` — surfaced by oscillating between the opening (micro) and the conclusion
  (micro) through the essay-level promise (macro). On fail, the diagnostic names the unresolved hook.
- `assert voice_consistent()` — a section that drifts in voice is a sentence/word-level betrayal of the
  essay-level voice. On fail, the diagnostic names the drifting section.
- `assert redundancy_low()` — repetition is often invisible at sentence zoom and obvious at essay zoom.
  On fail, the diagnostic quotes the repeated span and its twin.

## Idempotency

Each defect is upserted by stable id; re-oscillating over an unchanged span replaces its finding in place.
A re-run over unchanged inputs surfaces no new defects and writes only `updated`. When the draft changes,
only changed sections plus the essay-level view are re-swept. Identical inputs ⇒ identical oscillation
block.

## Output

```
APERTURE: <n> passes (<d> descents · <a> ascents)
DEFECTS BY LEVEL: essay <n> · section <n> · paragraph <n> · sentence <n> · word <n>
CROSS-ZOOM MISMATCHES: <n> (a level fails a promise made at another level)
ASSERTIONS: opening_resolves <p|f> · voice_consistent <p|f> · redundancy_low <p|f>
NEXT: RevisionLoop (repair mismatches) | Verification (clean)
```

## Gotchas

- **The mismatch is the finding, not the single-level flaw.** A clumsy sentence is the RevisionLoop's
  ordinary job; oscillation exists for the defect that only appears in the *relationship* between zooms.
- **Hold the essay constant; move only the aperture.** Don't change the draft mid-sweep — you're locating
  defects across levels, not editing.
- **Descend and ascend; a single direction misses half.** Macro-to-micro finds broken promises; micro-to-
  macro finds betrayed intent. Run both.
- **Locate at the surfacing level.** Tag where the defect appeared and which level it betrays, so the
  RevisionLoop knows whether to fix a word or rethink a section.
