---
schema: VoiceModel
version: 1.0.0
purpose: The applicant's authentic writing voice — rhythm, vocabulary, sentence-length distribution, tone, phrasings, and a fingerprint for drift detection.
machine_readable: true
location: artifacts/<applicant>/VoiceModel.md  (APPLICANT-SCOPED — reusable across essays via EssayState.shared_with)
---

# Schema: VoiceModel

`VoiceModel` captures how the applicant actually writes/speaks, derived from their raw
`ExperienceDatabase` narratives. It is **applicant-scoped** and reused across essays. It is the
reference for `assert authenticity_preserved()` (cliché scan + fingerprint distance) and
`assert voice_consistent()` (fingerprint variance across sections) — a section that drifts from the
`fingerprint` fails.

## Front matter

```yaml
---
id: voice-model                   # singleton per applicant
hash: <short content hash>
source_hashes: [ExperienceDatabase:<hash>]
applicant_scoped: true
fingerprint: <compact signature string for distance checks>
updated: <ISO-8601>
---
```

- **fingerprint** is the machine-comparable signature (e.g. encoded vocabulary + rhythm + length
  profile) that assertions measure distance against.

## Body structure

```markdown
## Rhythm
<how the prose moves — clipped vs flowing, where it pauses>

## Vocabulary
| id | register | examples | avoid |
|----|----------|----------|-------|
| voc-1 | <e.g. plain-clinical> | [<words they use>] | [<words they never use>] |

## Sentence length
| band | share |
|------|-------|
| short (<10w) | <0–1> |
| medium (10–20w) | <0–1> |
| long (>20w) | <0–1> |

## Tone
<the felt attitude — e.g. understated, earnest, dry>

## Characteristic phrasings
| id | phrasing | note |
|----|----------|------|
| phr-1 | <a turn of phrase they actually use> | <when it appears> |
```

- **sentence length** shares should sum to ~1.0; this distribution is part of the fingerprint.
- **characteristic_phrasings** are real to the applicant — fabricated "voice-y" phrases are an
  authenticity violation.

## Idempotency rules

- Singleton `id: voice-model`; sub-records upsert by `id` (voc-, phr-).
- `source_hashes: [ExperienceDatabase:<hash>]`; if the corpus changes, the model (and `fingerprint`)
  goes `stale` and is recomputed.

## Example (abbreviated)

```markdown
---
id: voice-model
hash: 3344
source_hashes: [ExperienceDatabase:e5f6]
applicant_scoped: true
fingerprint: plain-clinical|short-heavy|understated|v1
updated: 2026-06-23T00:08:00Z
---

## Sentence length
| band | share |
|------|-------|
| short (<10w) | 0.5 |
| medium (10–20w) | 0.4 |
| long (>20w) | 0.1 |

## Characteristic phrasings
| id | phrasing | note |
|----|----------|------|
| phr-1 | "I stayed" | recurs at moments of choice |
```
