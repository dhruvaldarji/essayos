---
description: Check whether an essay passage sounds like AI wrote it. Use when the user asks if their essay, paragraph, or personal statement sounds robotic, generic, like ChatGPT, or like AI, or asks what gives it away. Quotes each tell and names the pattern. Does not rewrite.
argument-hint: [essay-id or pasted text]
---

Scan a passage for signs of machine writing and for flat prose. Report, do not rewrite.

1. Read `${CLAUDE_PLUGIN_ROOT}/review/AITellScan.md` and the humanizer catalog. In Claude Code the
   catalog is the `humanizer` skill installed with this plugin. If that skill is not loaded, read
   `${CLAUDE_PLUGIN_ROOT}/agent-skills/humanizer/SKILL.md`.
2. Take the text from the argument, from the pasted message, or from
   `${CLAUDE_PLUGIN_ROOT}/artifacts/$ARGUMENTS/Drafts.md` when the argument is an essay id.
3. Walk the catalog strongest first. For each hit, quote the exact span and name the pattern and
   why it reads as machine-written. Patterns 1 to 5 count on one sighting. Weaker patterns count
   only when two land in the same paragraph.
4. Then check for flat prose. The signs are no reaction or specific detail, sentences of the same
   length, or four sentences in a row that open with the same word.
5. If the text belongs to an EssayOS essay, upsert the findings into `ReviewerFeedback.md` as
   `review/AITellScan.md` describes. Otherwise, only report.

Argument: $ARGUMENTS

Reply in plain English. Quote each span, name the pattern, and give the direction of the fix. Do
not rewrite the passage unless the user asks. Do not add any fact the user did not give. If the
user wants the essay revised in their own voice, tell them to run `/essayos:essay-ingest`.
