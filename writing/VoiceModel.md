---
skill: VoiceModel
category: writing
purpose: Infer the applicant's authentic voice fingerprint from their own answer samples so authenticity is checkable.
reads: [ExperienceDatabase, ApplicantModel]
writes: [VoiceModel]
preconditions: [ExperienceDatabase exists, ExperienceDatabase has >=3 raw applicant answer samples]
postconditions: [VoiceModel has a fingerprint covering rhythm, vocabulary, sentence-length distribution, tone, and characteristic phrasings, each grounded in quoted samples]
idempotency_key: upsert VoiceModel by applicant; no-op when source_hashes match ExperienceDatabase + ApplicantModel
asks_questions: false
---

# VoiceModel (writing)

The applicant writes in a voice. Every other writing skill must imitate it, and `assert
voice_consistent` and `assert authenticity_preserved` must check against it. This skill extracts that
voice from what the applicant *actually said* — never from a stylistic ideal — and freezes it as a
fingerprint. It is **applicant-scoped**: built once, reused across every essay via `shared_with`.

## When to run

Once, before any prose is written, as soon as the interview has produced enough raw answer samples
(>=3). Re-run only when `ExperienceDatabase` changes (new answers) or `ApplicantModel` changes. It is
not essay-specific, so a second essay reuses the existing VoiceModel rather than rebuilding it.

## The Loop

**OBSERVE** — Read `EssayState.md`, `ExperienceDatabase.md`, `ApplicantModel.md`. Collect every raw,
applicant-authored answer span (the verbatim text, not paraphrase). If a VoiceModel already exists,
read it and its `source_hashes`.

**ANALYZE** — If `source_hashes` match the current `ExperienceDatabase` + `ApplicantModel` hashes, the
voice is already captured → no-op. Otherwise measure, over the raw samples only:
- **Rhythm** — cadence, where pauses fall, run-on vs clipped, parallelism habits.
- **Vocabulary** — habitual word choices, register (plain vs ornate), domain terms used naturally,
  words the applicant *never* uses.
- **Sentence-length distribution** — min / median / max words per sentence and the mix (short-punch
  vs long-subordinate). Store as a distribution, not a single average.
- **Tone** — earnest, wry, understated, direct; emotional temperature.
- **Characteristic phrasings** — recurring constructions, idioms, hedges, connective habits that are
  recognizably this person.
Each dimension must be backed by >=2 quoted spans from the samples.

**PLAN** — Choose the smallest unit: write or refresh exactly the dimensions whose evidence changed.
Do not invent traits to fill a dimension; if the samples are too thin to support a dimension, mark it
`low_confidence` and record what answer would resolve it.

**EXECUTE** — Build the fingerprint: per dimension, the measured value + the quoted evidence spans +
a confidence. Add a short "cliché distance" note: phrases this applicant would *not* write, used by
`authenticity_preserved` to detect drift toward generic essay-speak.

**VERIFY** — Self-check (no Drafts exist yet, so no Drafts-touching assertions): every dimension has
>=2 quoted spans or is flagged `low_confidence`; no trait is asserted without a sample; the fingerprint
is reconstructable from the quotes alone.

**LEARN** — Append a `RevisionHistory` entry (Issue/Cause/Fix/Outcome) for any dimension that was
`low_confidence`; if thin voice samples recur, promote a `LessonsLearned` rule ("ask for a longer
free-write before modeling voice").

**UPDATE** — Upsert `VoiceModel` by applicant id, recompute `hash`, set
`source_hashes: [exp:<hash>, applicant:<hash>]`, update the EssayState registry row, set
`EssayState.next_skill` (typically `IncrementalWriter`), bump `updated`.

## Assertions

VoiceModel writes no prose into `Drafts`, so it triggers no Drafts assertions. Its own gate is
self-evidence: every fingerprint dimension is grounded in >=2 quoted applicant samples (or flagged
`low_confidence`). The fingerprint it produces is the *reference input* that `assert voice_consistent`
and `assert authenticity_preserved` later check Drafts against.

## Idempotency

Upsert by applicant. On OBSERVE, if `source_hashes` still match the upstream `ExperienceDatabase` and
`ApplicantModel` hashes, report "no change" and exit. A re-run on unchanged inputs is byte-identical
modulo `updated`. New answers change the ExperienceDatabase hash → VoiceModel goes `stale` → recompute.

## Output

```
VOICE: <n> dimensions captured, <k> low_confidence
EVIDENCE: every dimension grounded in >=2 quoted samples | gap: <dimension>
STALE: <none | downstream Drafts now stale vs new fingerprint>
NEXT: <skill>
```

## Gotchas

- **Model the voice they have, not the voice an essay "should" have.** The point is to preserve
  authenticity; polishing the voice toward eloquence defeats `authenticity_preserved`.
- **No quote, no trait.** A fingerprint dimension with no sample backing is fabrication and will make
  every downstream voice check lie.
- **Capture the negatives too** — the words and constructions this person never uses are what catch
  generic essay-speak later.
- **Applicant-scoped, not essay-scoped.** Never rebuild it per essay; reuse via `shared_with`. Rebuild
  only when the applicant's own answers change.
- **Thin samples are a process gap, not an applicant failure** — route back to interview for a longer
  free-write rather than guessing the voice.
