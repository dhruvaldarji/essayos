---
description: The user asks for the status of an essay that does not exist. The plugin must say it cannot find the workspace and must not invent a phase, score, or next step.
plugins: ["../..", "../../skills/humanizer", "../../skills/simple-english"]
tags: [status, anti-hallucination]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: The reply says there is no essay workspace named med-school-2027 and offers to start or ingest one. No fabricated status.
---

What's the status of my EssayOS essay called med-school-2027? Where did we leave off?
