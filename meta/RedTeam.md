---
skill: RedTeam
category: meta
purpose: Attack the essay adversarially — assumptions, clichés, unsupported claims, weak narratives — and record every successful attack as located reviewer feedback.
reads: [EssayState, Drafts, ClaimEvidenceMap, ThemeGraph, MessageMap, VoiceModel]
writes: [ReviewerFeedback]
preconditions: [Drafts has a working draft]
postconditions: [ReviewerFeedback holds a RedTeam block enumerating each landed attack, located, with severity and a repair direction]
idempotency_key: each attack upserted by stable id (attack_class + section + span); re-run on unchanged Drafts + ClaimEvidenceMap is a no-op
asks_questions: false
---

# RedTeam (meta)

A friendly read finds what is good; an adversarial read finds what will sink the essay in front of a
hostile reviewer. RedTeam assumes the reader is unimpressed, skeptical of every claim, allergic to
cliché, and looking for a reason to move on. It tries to break the essay on purpose, then records only
the attacks that **land** — each as a located, severity-ranked finding with a repair direction. It pairs
with the `Skeptic` specialist (the line-level attacker) and feeds the RevisionLoop. It flags; it never
rewrites.

## When to run

Before Verification on any complete draft, and whenever the Orchestrator escalates a stall to "is the
narrative or message wrong, not the prose?". Re-run after each revision round so fixes do not reopen old
attack surfaces. Re-run when `ClaimEvidenceMap` changes — new untraceable claims are fresh ammunition.

## The attack classes

| Attack class | The question it asks | Lands when |
|--------------|----------------------|------------|
| **Assumption** | what does this take for granted that a reviewer won't grant? | an inference rests on an unstated, unearned premise |
| **Cliché** | have I read this exact sentiment a thousand times? | a phrase/sentiment matches the cliché list or reads as template |
| **Unsupported claim** | is this asserted virtue actually shown? | a claim has no backing experience in `ClaimEvidenceMap` |
| **Weak narrative** | would a skeptic find this stakes-free or generic? | the arc has no real tension, cost, or change |
| **Performance** | does this perform vulnerability instead of revealing it? | the emotional beat reads as manufactured for effect |

## The Loop

**OBSERVE** — Read `EssayState.md`, `Drafts.md` (working draft), `ClaimEvidenceMap.md` (claim → evidence
links), `ThemeGraph.md`, `MessageMap.md`, and `VoiceModel.md`. Read `LessonsLearned` for prior attacks
that already became rules.

**ANALYZE** — Determine staleness: if the RedTeam block's `source_hashes` still match Drafts and
ClaimEvidenceMap, the attack surface is unchanged — skip. Otherwise, identify which sections changed and
re-attack those.

**PLAN** — Choose the next attack class to run against the next changed section. One attack class per
loop, run hardest first where the draft is most exposed.

**EXECUTE** — Mount the attack: actively try to break that span on that class. Keep only attacks that
**land** — for each, record the exact span, the attack class, a severity (blocker / serious / minor), and
a concrete repair direction. Discard attacks the draft survives; surviving an attack is evidence of
strength, not a finding.

**VERIFY** — Run the assertions below via `kernel/AssertionEngine`. Every landed attack must be located
(section + span); an unlocated attack is rejected. The assertions also confirm the attack is real, not a
matter of taste.

**LEARN** — Append a `RevisionHistory` entry per landed attack (Issue = the attack, Cause, Fix direction,
Outcome pending). A recurring attack class across drafts becomes a `LessonsLearned` rule.

**UPDATE** — Upsert each landed attack into the `ReviewerFeedback` RedTeam block by stable id (attack_class
+ section + span). Recompute `hash`, set `source_hashes`, update the `EssayState` row, bump `updated`. Hand
back to the Orchestrator with the blocker count.

## Assertions

- `assert evidence_exists(claim)` — every claim RedTeam flags as unsupported is checked against the
  evidence base. On fail, the diagnostic lists the unbacked claims.
- `assert authenticity_preserved()` — cliché-scan and VoiceModel-distance back the cliché and performance
  attacks. On fail, the diagnostic quotes the offending line and the failing dimension.
- `assert claim_traceable(claim)` — an unsupported-claim attack is confirmed only when the claim has no
  traceable link in `ClaimEvidenceMap`. On fail, the diagnostic names the untraceable claim.

## Idempotency

Each attack is upserted by stable id; re-attacking an unchanged span replaces its finding in place. A
re-run over unchanged inputs lands no new attacks and writes only `updated`. When the draft changes, only
changed sections are re-attacked; findings on untouched spans are preserved. Identical inputs ⇒ identical
RedTeam block.

## Output

```
RED TEAM: <n> attacks landed (<b> blocker · <s> serious · <m> minor)
BY CLASS: assumption <n> · cliché <n> · unsupported <n> · weak-narrative <n> · performance <n>
TOP THREAT: <the single attack most likely to sink the essay>
ASSERTIONS: evidence_exists <p|f> · authenticity_preserved <p|f> · claim_traceable <p|f>
NEXT: RevisionLoop (repair blockers first) | Verification (no blockers)
```

## Gotchas

- **Only landed attacks are findings.** An attack the draft survives is not a weakness — discard it,
  don't pad the report.
- **Attack the essay, not the applicant.** The target is the argument, the claim, the phrasing — never the
  person or their real experience.
- **Locate everything.** A blocker with no span is unactionable; pin every attack to a section and span.
- **Pairs with the Skeptic, doesn't duplicate it.** RedTeam runs the structured attack classes;
  the `Skeptic` specialist does the free-form line-level hunt. Surface where they converge.
- **Severity is honest, not inflated.** Calling everything a blocker trains the RevisionLoop to ignore
  you. Reserve blocker for what truly fails the essay.
