---
skill: Council
category: meta
purpose: Convene multiple domain specialists who deliberate independently first, then synthesize their views into consolidated reviewer feedback the essay can act on.
reads: [EssayState, Drafts, MessageMap, NarrativeModel, ProgramFitModel, QualityMetrics]
writes: [ReviewerFeedback]
preconditions: [Drafts has a working draft OR a concrete decision is in question, MessageMap exists]
postconditions: [ReviewerFeedback holds one located block per specialist plus one synthesis block reconciling them]
idempotency_key: per-specialist + synthesis findings upserted by stable id (specialist + section + claim); re-run on unchanged Drafts + MessageMap + ProgramFitModel is a no-op
asks_questions: false
---

# Council (meta)

A council is not a poll. Its value comes from specialists forming their views **independently** before
they see each other's — that is what kills groupthink and surfaces the genuine disagreement that a
single averaged opinion hides. This skill convenes domain specialists from `specialists/`, has each one
read the artifact in isolation, and only then synthesizes. The synthesis preserves dissent; it does not
dissolve it. Like every review skill, Council flags and recommends — it never rewrites prose.

## When to run

When the Orchestrator stalls and `meta/RootCauseAnalysis` points at the narrative or message rather than
the prose; when a structural decision (which experience leads, which theme to cut) has no clear winner;
or any time a draft needs more than one expert lens at once. Re-run when `Drafts`, `MessageMap`, or
`ProgramFitModel` changes — each shifts what the specialists are reading for.

## The Loop

**OBSERVE** — Read `EssayState.md`, the artifact under deliberation (usually `Drafts.md`), plus
`MessageMap.md`, `NarrativeModel.md`, and `ProgramFitModel.md`. Read `QualityMetrics` to know which
dimension is weakest, and `LessonsLearned` for rules whose trigger matches.

**ANALYZE** — Determine which specialist blocks are stale: a block whose `source_hashes` no longer match
the current inputs must be re-run; fresh blocks are skipped. Decide the council roster — choose the 3-6
specialists whose lenses bear on the open question (over six dilutes; generic seats add noise).

**PLAN** — Choose the next stale specialist to deliberate. One specialist per loop, each reading
**without** sight of the others' blocks. Synthesis is planned only after all seats are fresh.

**EXECUTE** — Invoke that specialist agent on the artifact with its independent lens. Collect a located
position: its read, its strongest concern, its strongest endorsement, and a one-line recommendation —
all pinned to a section or claim. When the last seat is fresh, run the synthesis pass: cluster agreements,
name the live disagreements explicitly, and resolve each (or record it as an open question for the
applicant) without averaging the seats away.

**VERIFY** — Run the assertions below via `kernel/AssertionEngine`. Every position and synthesis claim
must be located; an unlocated finding is rejected and sent back to its specialist.

**LEARN** — Append a `RevisionHistory` entry for each substantive disagreement and its resolution (Issue
/ Cause / Fix direction / Outcome pending). A point all specialists hit independently is the strongest
signal in the system — promote it to `LessonsLearned` if it recurs.

**UPDATE** — Upsert each specialist block and the synthesis block into `ReviewerFeedback` by stable id
(specialist + section + claim). Recompute `hash`, set `source_hashes`, update the `EssayState` row, bump
`updated`. Hand back to the Orchestrator with the synthesis as the actionable summary.

## Assertions

- `assert prompt_answered()` — the deliberation is grounded in whether the essay answers the prompt, not
  abstract taste. On fail, the diagnostic names the unaddressed clause.
- `assert theme_supported(theme)` — any theme the council endorses or attacks is checked against its
  evidence base. On fail, the diagnostic names the theme and its support count.
- `assert authenticity_preserved()` — recommendations cannot push the draft toward cliché or performance.
  On fail, the diagnostic quotes the offending suggestion.

## Idempotency

Each specialist block and the synthesis are upserted by stable id; re-running a specialist on unchanged
inputs replaces its block in place. A re-run over unchanged inputs re-runs no specialist and re-synthesizes
nothing — it writes only `updated`. When inputs change, only specialists whose `source_hashes` drifted are
re-invoked, and the synthesis recomputes from the refreshed set. Identical inputs ⇒ identical consolidated
`ReviewerFeedback`.

## Output

```
COUNCIL: <k> specialists deliberated · <n> independent positions
AGREEMENTS: <n> (cite specialists)
DISAGREEMENTS: <n> live — <one line each, resolved | open>
SYNTHESIS: <the consolidated recommendation>
ASSERTIONS: prompt_answered <p|f> · theme_supported <p|f> · authenticity_preserved <p|f>
NEXT: RevisionLoop (apply synthesis) | Discovery (open question to applicant)
```

## Gotchas

- **Independence before synthesis, always.** If specialists see each other's views first, you get an echo,
  not a council. Collect every position in isolation, then reconcile.
- **Cite the specialist, never anonymize.** A finding's weight depends on whose lens produced it; attribute
  every agreement and disagreement to a named seat in `specialists/`.
- **Preserve dissent.** A view only one specialist holds may be the correct one. Record it; do not average
  it into the consensus.
- **3-6 well-chosen seats beat a dozen generic ones.** Compose the roster to the question; do not seat a
  specialist whose lens does not bear on it.
- **Council deliberates; RevisionLoop edits.** The output is direction, not new prose.
