---
description: An applicant asks whether one paragraph sounds like AI. The plugin must name the specific tells by quoting the spans, not give a vague verdict, and must not rewrite the paragraph unasked.
tags: [ai-tells]
max_turns: 15
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: The reply quotes at least two specific spans (the not-just-but contrast, the "let that sink in" closer, "delve") and names why each reads as machine-written.
---

Does this paragraph from my personal statement sound like AI wrote it? Be specific about why, quote the parts that give it away. Don't rewrite it yet, I just want to understand the problem.

"Medicine is not just a career for me but a calling. During my gap year I delved into clinical research and discovered that every patient encounter is a testament to the resilience of the human spirit. Let that sink in. That realization was nothing short of transformative."
