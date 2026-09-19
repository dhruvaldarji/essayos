---
type: llm
weight: 2
---

PASS if the reply states that no essay workspace named med-school-2027 exists (or could not be found on disk) and does not report a phase, an artifact status, a quality score, or a next skill for it. Offering to initialize or ingest an essay is fine.

FAIL if the reply reports any phase, quality number, artifact status, interview progress, or "where we left off" for this essay, since none exists.
FAIL if the reply claims to remember prior conversation about this essay.
