---
skill: PersonalizationReview
category: review
purpose: Turn the review findings on an ingested essay into one voice-preserving, experience-grounded suggestion at a time — before/after, sourced to a real experience — and record the applicant's decision on each before anything is applied.
reads: [Drafts, ReviewerFeedback, ClaimEvidenceMap, ExperienceDatabase, VoiceModel, IngestReport, LessonsLearned]
writes: [ReviewerFeedback, IngestReport]
preconditions: [EssayState.mode is ingest, VoiceModel exists, ClaimEvidenceMap exists, ReviewerFeedback has at least one open finding from AITellScan or AuthenticityAuditor or CommitteeReview]
postconditions: [every open finding has a suggestion with before/after/source_experience or a ground question, and each suggestion has an applicant_decision recorded before RevisionLoop may apply it]
idempotency_key: suggestions upserted by stable id (finding id + draft hash); a decided suggestion is never re-asked; re-run on unchanged inputs is a no-op
asks_questions: true
---

# PersonalizationReview (review)

This is where an essay that sounds like a model becomes an essay that sounds like the person who
lived it. Every other reviewer says what is wrong. This skill says what *this applicant* would have
written instead, using only two sources: the words already in the draft, and the experiences the
applicant gave in the interview. It proposes one change, shows the exact before and after, names the
experience the after text draws on, and asks. Yes, edit, or no. Nothing is applied until the
applicant has answered, and a "no" is final for that draft.

The bar for every `after`: it must sound like the `VoiceModel` (their rhythm, their words, their
temperature), it must carry a reaction or a specific detail the applicant actually gave, it must add
no fact the applicant did not supply, and it must pass the humanizer catalog cleanly. Human,
specific, and theirs. Not smoother. Not more impressive. Theirs.

## When to run

In ingest mode, whenever `ReviewerFeedback` holds an open finding (from `AITellScan`,
`AuthenticityAuditor`, or `CommitteeReview`) and the applicant has not yet decided on a suggestion
for it. Alternates with `RevisionLoop` (which applies the accepted ones) until no open findings remain
or the applicant says stop.

## The Loop

**OBSERVE** — Read `Drafts.md` (`best/`, which starts as `draft-ingested`), `ReviewerFeedback.md`
(open findings and existing suggestions with their decisions), `ClaimEvidenceMap.md` (which claims
are traceable and to what), `ExperienceDatabase.md` (the only source of new detail), `VoiceModel.md`
(the fingerprint and the quoted samples), `IngestReport.md`, and `LessonsLearned`.

**ANALYZE** — Pick the single highest-value open finding: an untraceable claim first (it is the most
dangerous), then a strong AI tell, then a monotone section, then committee concerns, then weak-tell
clusters. Classify its repair:
- **ground** — the passage claims something with no experience behind it (`traceable: false`). The
  honest suggestion is a *question*, not a rewrite. Hand it to `GrillMe`'s targeted mode with the
  claim as the target; when the answer lands in `ExperienceDatabase`, this finding comes back as
  `revise`.
- **revise** — the passage is the applicant's claim, but it is stated instead of shown, or it reads
  like a model, or it is flat. Draft a replacement.
- **keep** — the finding is licensed by the VoiceModel or the applicant already declined it. Close it.

**PLAN** — One suggestion. Scope it to the smallest span that fixes the finding (a sentence, at most
a paragraph). Choose the `source_experience` the `after` will draw on; if there is none, the class is
`ground`, not `revise`.

**EXECUTE** —
1. Write the `after` text in the applicant's voice. Method: start from their own words in the
   `before` span and in the source experience's `raw` narrative; keep their sentence-length mix and
   their vocabulary register; include the specific detail or the reaction *they* reported; remove the
   tell. Then run the humanizer skill in embedded mode with the VoiceModel's quoted spans as the
   writing sample (CONVENTIONS §10) and keep only what survives.
2. Upsert the suggestion into `ReviewerFeedback` (`sug-N`: finding id, section, `before`, `after`,
   `source_experience`, `applicant_decision: proposed`). Mirror the passage row in `IngestReport`.
3. Ask **one** question via `ask_question()`: show the before and the after, say in one plain sentence
   why (which pattern, which claim), name the experience it draws on, and ask: accept, edit, or
   reject? If they edit, store their text as `after` with `applicant_decision: edited`. If they
   reject, record `rejected` and never propose that change again on this draft.

**VERIFY** — Before asking: `assert claim_traceable()` on every factual element of `after` (it must
trace to `source_experience` or to the `before` span), `assert voice_consistent()` (fingerprint
distance of `after` within threshold), `assert ai_tells_absent()` on `after`, and
`assert personality_present()` on the section as it would read with `after` in place. A failing
`after` is rewritten before the applicant ever sees it. After the answer: `assert suggestion_approved()`
holds for any suggestion `RevisionLoop` is about to apply.

**LEARN** — Append a `RevisionHistory` entry (Issue = the finding, Cause = process-level, e.g. "the
draft claimed a trait the interview had not yet grounded", Fix = the suggestion and the decision,
Outcome = pending until RevisionLoop applies it). Two rejections of the same *kind* of suggestion
promote a `LessonsLearned` rule ("this applicant does not want sensory openers").

**UPDATE** — Upsert `ReviewerFeedback` and `IngestReport` (counts: open, accepted, rejected; the
passage row's `decision`), recompute hashes, set `source_hashes`, update EssayState rows, set
`next_skill`: `RevisionLoop` if a suggestion is `accepted|edited` and unapplied; `GrillMe` if the
finding was `ground`; `PersonalizationReview` if open findings remain; else the Orchestrator's next
verification step. Bump `updated`.

## Assertions

- `assert claim_traceable(claim)` — every factual element in `after` traces to `source_experience`
  or the `before` span. On fail: the suggestion is discarded; nothing invented reaches the applicant.
- `assert voice_consistent()` — `after` sits within the VoiceModel fingerprint threshold.
- `assert ai_tells_absent()` — `after` is clean against the humanizer catalog.
- `assert personality_present(section)` — the section with `after` in place has a reaction or a
  specific detail and varied sentence length.
- `assert suggestion_approved(suggestion)` — a suggestion is applied only with
  `applicant_decision ∈ {accepted, edited}` and a `decided_at` timestamp.

## Idempotency

Each suggestion is keyed by `finding id + draft hash`. A decided suggestion is never re-asked; a
re-run on unchanged inputs finds no undecided suggestion and writes only `updated`. When the draft
changes (a suggestion was applied), findings on unchanged sections keep their decisions; only findings
on the changed section are re-evaluated. `rejected` is sticky for the life of the draft it was
rejected on. Identical inputs ⇒ identical `after` text (modulo `updated`).

## Output

```
FINDING: <id> — <ground|revise|keep> — <section> — <pattern or claim>
BEFORE:  "<exact span>"
AFTER:   "<proposed text>"  (draws on <exp-id>: "<its title>")
WHY:     <one plain sentence>
ASKED:   accept / edit / reject?   →   <decision | waiting>
NEXT:    RevisionLoop (accepted) | GrillMe (ground) | PersonalizationReview (more open) | Verification
```

## Gotchas

- **No source experience, no rewrite.** A vivid `after` with an invented detail is the exact harm this
  system exists to prevent. When there is nothing to draw on, ask; do not write.
- **Their voice, not a better voice.** If the VoiceModel is understated and clipped, the `after` is
  understated and clipped. Smoothing a real voice into competent sameness is the failure the
  `CopyEditor` persona also refuses.
- **Personality is a reaction or a detail they gave, not adjectives you add.** "I was furious" is
  theirs only if they said it. "I remember the smell of the floor cleaner" is theirs only if it is in
  `ExperienceDatabase`.
- **One suggestion, one question, then wait.** Presenting five suggestions at once is a contract
  violation and it robs the applicant of the decision on each.
- **A rejection is information, not an obstacle.** Never re-propose a rejected change with different
  wording. Record why, and if it recurs, learn the rule.
- **`self_authored: false` raises the bar for `after`.** With no trustworthy voice sample in the
  draft, the voice comes from interview answers only; lean harder on their raw words.
