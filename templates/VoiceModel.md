---
artifact: VoiceModel
scope: applicant            # applicant-scoped; reusable across essays via shared_with
essay_id: ""
hash: ""
source_hashes: []          # [ExperienceDatabase:<hash>]  (voice is sampled from the applicant's own words)
last_skill: ""
updated: ""
---

# VoiceModel

A model of how the applicant actually writes and speaks, sampled from their own interview answers.
The writer drafts in this voice so the essay reads as the applicant, not the model. Applicant-scoped
and reusable.

## Profile

register: ""              # formal | conversational | reflective | plainspoken | ...
sentence_rhythm: ""       # short and punchy | long and layered | varied
diction: ""              # vocabulary level / field-specific terms they actually use
cadence_notes: ""
person: ""               # first-person, etc.

## Signature

characteristic_phrases: []   # real phrasings the applicant used
favored_constructions: []
avoid: []                    # words/constructions that do NOT sound like them; AI tells to suppress
sample_quotes: []            # verbatim lines from the interview that anchor the voice
