---
description: An applicant pastes an AI-assisted scholarship essay and asks for help making it sound like them. The plugin must start the ingest flow, store the text as-is, and ask exactly one question. It must not rewrite the essay or invent details.
plugins: ["../..", "../../agent-skills/humanizer", "../../agent-skills/simple-english"]
tags: [ingest, smoke]
max_turns: 20
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit]
expected_outcome: The essay-ingest command runs. The reply contains exactly one question (for the prompt, type, limit, program, or authorship) and no rewritten essay.
---

I wrote this scholarship essay with some help from ChatGPT and it sounds kind of generic. Can you review it and help it sound more like me? Here it is:

Growing up, I was always deeply passionate about science. It wasn't just a subject to me; it was a way of seeing the world. In high school I delved into a research project on water quality that was a testament to my curiosity and dedication. I learned that the real question is not what we measure but why we measure it. Let that sink in. This journey has been nothing short of transformative, and I know that with this scholarship I will continue to make a meaningful impact on my community.
