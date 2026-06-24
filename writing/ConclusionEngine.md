---
skill: ConclusionEngine
category: writing
purpose: Resolve the opening — pay off the hook's image, idea, or question — so the essay closes a loop instead of trailing off.
reads: [Drafts, MessageMap, NarrativeModel]
writes: [Drafts]
preconditions: [Drafts has a drafted opening section and a drafted closing section in working/, MessageMap exists, NarrativeModel exists]
postconditions: [the conclusion transforms and resolves an element raised in the opening; overall quality improved by >= epsilon or the change is rejected]
idempotency_key: upsert the conclusion section in Drafts by section id + content hash; an already-resolving conclusion is a no-op
asks_questions: false
---

# ConclusionEngine (writing)

The opening makes a promise — an image, an idea, a question. The conclusion's job is to **pay it off**,
transformed by everything between. This skill rewrites the closing so it resolves the opening's hook,
delivers the essay's core message, and lands the narrative arc. It edits **locally** (the conclusion,
and at most the opening's resolvable element), and honors the ratchet — accept only when
`QualityMetrics.overall` improves by >= `epsilon`, and never replace `best/` with something worse.

## When to run

Late, once the body and opening are stable — after `IncrementalWriter`, `ReflectionEngine`, and
usually `TransitionEngine`. Run when the conclusion is missing, generic, or fails to echo the opening.
Re-running on a conclusion that already resolves the opening is a no-op.

## The Loop

**OBSERVE** — Read `EssayState.md`, `Drafts.md` (`best/` + `working/`), `MessageMap.md` (the core
message the ending must land), and `NarrativeModel.md` (the arc the ending must complete). Read the
opening section's text. Consult `LessonsLearned`.

**ANALYZE** — Identify the opening's hook: the specific image / idea / question in paragraph one that
the reader is implicitly promised a payoff for. Check whether the current conclusion resolves it
(transformed, not merely repeated), lands the `MessageMap` core message, and completes the
`NarrativeModel` arc. Diagnose exactly what is unresolved.

**PLAN** — Plan one localized edit to the conclusion (and, only if needed, the precise opening token to
be echoed): how the opening element recurs transformed, how the core message lands. Touch nothing else.

**EXECUTE** — Rewrite the conclusion in `working/` so it resolves the opening — the hook returns,
changed by the journey — and delivers the message. Keep the applicant's voice. No restating the essay,
no "in conclusion," no grand universal moral, no cliché bow.

**VERIFY** — Run the assertion below. Score the complete `working/` draft against `best/`. A failed
assertion or sub-epsilon gain blocks acceptance.

**LEARN** — Append a `RevisionHistory` entry (Issue = "opening hook X never resolved", Cause = e.g.
"conclusion summarized instead of paying off", Fix, Outcome). Promote a `LessonsLearned` rule on
recurrence.

**UPDATE** — Upsert the conclusion section (and the opening, if its echoed token changed) in
`Drafts.working/` by id; recompute hashes and `source_hashes`. **Ratchet:** keep the edit only if the
complete `working/` draft beats `best/` by >= `epsilon`; replace `best/` only then; otherwise revert
and leave `best/` intact. Update the EssayState row, set `next_skill`, bump `updated`.

## Assertions

Calls `assert opening_resolves()` — the conclusion must pay off an image/idea/question raised in the
opening (a token or concept from paragraph one recurs, transformed, in the final paragraph). On
failure the diagnostic names the opening hook left unresolved, and the fix is localized to the
conclusion.

## Idempotency

Upsert by the conclusion's section id. On OBSERVE, if the conclusion already resolves the opening and
its `source_hashes` match `MessageMap` / `NarrativeModel` / the opening section, it is skipped. Re-runs
on a resolving conclusion are byte-identical modulo `updated`. Accept-only ratchet prevents regression.

## Output

```
CONCLUSION: opening hook "<hook>" resolved
ASSERTIONS: opening_resolves: pass|fail — <diagnostic>
RATCHET: best <x.xx> -> candidate <x.xx> (accepted | rejected, reverted)
NEXT: <skill>
```

## Gotchas

- **Resolve, don't repeat.** Echoing the opening verbatim is not a payoff; the hook must return
  *transformed* by the essay's middle. Same image, new meaning.
- **Don't summarize the essay.** A recap conclusion wastes the strongest position in the piece. Land
  the message and close the loop instead.
- **One message, landed.** Pull the core message from `MessageMap`; do not invent a new thesis in the
  final paragraph.
- **No grand morals or clichéd bows.** "And that is why I will be a great doctor" is a cliché; resolve
  the specific opening image and let the reader draw the conclusion.
- **Localized edit.** Touch the conclusion (and at most the opening's echoed token); the ratchet
  forbids reaching into the body to manufacture a callback.
