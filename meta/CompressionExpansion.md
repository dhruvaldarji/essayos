---
skill: CompressionExpansion
category: meta
purpose: Compress the essay to its irreducible core message, then expand only where meaning is underserved — raising meaning-per-word and serving the word budget.
reads: [EssayState, Drafts, MessageMap, Requirements, ThemeGraph]
writes: [ReviewerFeedback]
preconditions: [Drafts has a working draft, MessageMap exists, Requirements has a word/character limit]
postconditions: [ReviewerFeedback holds a density block: spans to cut (low meaning-per-word) and spans to expand (under-served meaning), each located]
idempotency_key: each cut/expand recommendation upserted by stable id (op + section + span); re-run on unchanged Drafts + MessageMap + Requirements is a no-op
asks_questions: false
---

# CompressionExpansion (meta)

Word budgets are not a formatting nuisance — they are the central constraint that forces every sentence to
earn its place. This skill works in two moves. **Compress:** strip the essay to the minimum that still
carries the core message — cut filler, hedges, throat-clearing, and any sentence that restates rather than
advances. **Expand:** then reinvest the freed words *selectively*, only where the core message is asserted
but not yet earned (a claim that needs its showing, a turn that needs its beat). The net effect is higher
meaning density inside a fixed budget: fewer words, more essay. It flags cuts and expansions; the
RevisionLoop makes them.

## When to run

When `word_budget` fails over-limit (compression dominates) or when the draft is under-limit but thin
(expansion dominates). Also as a polish pass before Verification to raise density even when the budget is
met. Re-run when `Drafts`, `MessageMap`, or `Requirements` changes.

## The two moves

| Move | Targets | Rule |
|------|---------|------|
| **Compress** | filler, hedges, redundant restatement, scene detail that doesn't serve the message, adverbs propping weak verbs | cut anything whose removal does not lose meaning the core message needs |
| **Expand** | asserted-but-unshown claims, growth turns stated in one line, the single most important beat | add words only where the *core message* is currently under-served — never to fill space |

The discipline is sequence: compress **first** to find the true core and free the budget, expand
**second** into the gaps that compression exposed. Expanding before compressing just pads.

## The Loop

**OBSERVE** — Read `EssayState.md`, `Drafts.md` (working draft), `MessageMap.md` (the core message and its
support), `Requirements.md` (the hard limit), and `ThemeGraph.md`. Read `LessonsLearned` for density rules.

**ANALYZE** — Compute current length vs `Requirements.word_limit` and decide the dominant move. Determine
staleness against Drafts + MessageMap + Requirements; if unchanged, prior recommendations stand — skip.

**PLAN** — Choose the next move on the next section: a compression pass (mark low-density spans to cut) or
an expansion pass (mark under-served core spans to grow). One move on one section per loop, compression
before expansion.

**EXECUTE** — For compression: identify each low meaning-per-word span and record a located cut with the
words saved. For expansion: identify each under-served core claim and record a located expansion with what
it must show (drawn from a real `ThemeGraph`/experience node, never invented). Track running budget impact.

**VERIFY** — Run the assertions below via `kernel/AssertionEngine`. A cut must not remove core meaning; an
expansion must serve the message and trace to real evidence; the net must move toward the budget.

**LEARN** — Append a `RevisionHistory` entry per substantive recommendation (Issue / Cause / Fix direction /
Outcome pending). A recurring filler pattern (a habitual hedge) becomes a `LessonsLearned` rule.

**UPDATE** — Upsert each cut/expand recommendation into the `ReviewerFeedback` density block by stable id
(op + section + span). Recompute `hash`, set `source_hashes`, update the `EssayState` row, bump `updated`.

## Assertions

- `assert word_budget()` — the net of the recommended cuts and expansions brings the draft within the
  limit. On fail, the diagnostic reports the over/under by N.
- `assert redundancy_low()` — compression targets repetition; what survives must not restate. On fail, the
  diagnostic quotes the repeated span and its twin.
- `assert theme_supported(theme)` — an expansion may only draw on themes with real evidence (≥2
  experiences). On fail, the diagnostic names the theme that cannot support the proposed expansion.

## Idempotency

Each recommendation is upserted by stable id; re-running on an unchanged span replaces it in place. A
re-run over unchanged inputs recommends nothing and writes only `updated`. When inputs change, only
affected sections are re-evaluated. Identical inputs ⇒ identical density block.

## Output

```
DENSITY: net <±N> words toward budget (current <N>/<limit>)
CUTS: <n> spans · <N> words saved (filler/hedge/restatement)
EXPANSIONS: <n> spans · <N> words added (under-served core message)
CORE MESSAGE: <the irreducible message compression confirmed>
ASSERTIONS: word_budget <p|f> · redundancy_low <p|f> · theme_supported <p|f>
NEXT: RevisionLoop (apply cuts then expansions) | Verification (within budget)
```

## Gotchas

- **Compress before you expand.** Finding the true core first is what tells you where expansion is
  actually owed; the reverse just adds padding.
- **Never cut the load-bearing.** A cut that removes meaning the core message needs is a regression, not a
  saving. Density means meaning-per-word up, not word-count down at any cost.
- **Expansion draws on real evidence only.** Reinvested words must show something the applicant actually
  experienced — never invent a beat to fill the freed budget.
- **The budget is a constraint, not a target to hit exactly.** Slightly under with full meaning beats
  on-the-nose with padding.
- **Flag, never edit.** The output is located cut/expand recommendations; the RevisionLoop makes the
  ratchet-gated change.
