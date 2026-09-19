---
description: Self-test the EssayOS package. Use when the user asks to lint, validate, or check the EssayOS package, its skills, its schemas, or its plugin manifests.
---

Run the EssayOS self-test. It verifies that the package is internally consistent.

1. If Node is available, run `node ${CLAUDE_PLUGIN_ROOT}/bin/essayos.mjs lint` and report the result.
2. The linter checks these things. Every skill has the required front matter and body sections.
   Every `reads` and `writes` entry names an artifact that has a schema. Every assertion named in a
   skill exists in `kernel/AssertionEngine.md`. Every required file exists. The Claude and Codex
   manifests parse and agree on the version. The vendored skills in `agent-skills/` match
   `agent-skills/VENDORED.json`. The user-facing docs follow the plain-English rules.
3. If Node is unavailable, perform the same checks by reading the files and report any drift.

Report PASS or FAIL with the specific violations.
