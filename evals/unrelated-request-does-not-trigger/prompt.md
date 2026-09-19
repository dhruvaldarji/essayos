---
description: A plain shell question. The plugin's skills must not fire, and the answer must still be correct.
plugins: ["../..", "../../skills/humanizer", "../../skills/simple-english"]
tags: [negative]
max_turns: 5
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: A one-line shell answer with no EssayOS skill invoked.
---

Give me a one-line bash command that counts the total lines across all .py files under the current directory.
