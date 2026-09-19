---
name: essay-scan
description: |
  Check whether a passage of an application essay sounds like AI wrote it. Use when the user asks
  if their essay, paragraph, or personal statement sounds robotic, generic, like ChatGPT, or like
  AI, or asks what gives it away. Quotes each tell, names the pattern, and flags flat or monotone
  prose. Does not rewrite.
---

# essay-scan

The plugin root is two directories above this file. Paths below are relative to that root.

1. Read `review/AITellScan.md` and the humanizer catalog at `agent-skills/humanizer/SKILL.md`.
2. Take the text the user gave, or read `artifacts/<essay_id>/Drafts.md` when they name an essay.
3. Walk the catalog strongest first. For each hit, quote the exact span and name the pattern and
   why it reads as machine-written. Patterns 1 to 5 count on one sighting. Weaker patterns count
   only when two land in the same paragraph.
4. Then check for flat prose. The signs are no reaction or specific detail, sentences of the same
   length, or four sentences in a row that open with the same word.
5. If the text belongs to an EssayOS essay, upsert the findings into `ReviewerFeedback.md` as
   `review/AITellScan.md` describes. Otherwise, only report.

Reply in plain English. Quote each span, name the pattern, and give the direction of the fix. Do
not rewrite the passage unless the user asks. Do not add any fact the user did not give. If the
user wants the essay revised in their own voice, point them to `essay-ingest`.
