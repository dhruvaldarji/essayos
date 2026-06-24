---
description: Lint the EssayOS package itself, verify all skills/schemas/contracts are consistent.
---

Run the EssayOS self-test (verifies the package is internally consistent, the "testable" surface).

1. If Node is available, run `node ${CLAUDE_PLUGIN_ROOT}/bin/essayos.mjs lint` and report the result.
2. The linter checks: every skill has required front matter + body sections; every `reads`/`writes`
   references an artifact that has a schema; every assertion named in a skill exists in
   `kernel/AssertionEngine.md`; required files exist; and required guard phrasing is present (warnings).
3. If Node is unavailable, perform the same checks by reading the files and report any drift.

Report PASS/FAIL with the specific violations.
