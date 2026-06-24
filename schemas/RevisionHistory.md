---
schema: RevisionHistory
version: 1.0.0
purpose: The durable log of every fix — Issue/Cause/Fix/Outcome — so the same mistake is not made twice.
machine_readable: true
location: artifacts/<essay_id>/RevisionHistory.md
---

# Schema: RevisionHistory

`RevisionHistory` is the durable record of every revision, assertion failure, and dead end. It is
written at the LEARN step of every skill and by `kernel/AssertionEngine` on any failed assertion. Its
entry shape matches `kernel/LearningLayer.md` exactly. Recurring causes (≥2) are promoted into
`LessonsLearned`. History is never deleted — supersede, never erase.

## Front matter

```yaml
---
id: revision-history
hash: <short content hash>
source_hashes: []                # an append-superseding log; not derived from a single upstream
updated: <ISO-8601>
---
```

## Body structure

Entries match `LearningLayer` verbatim — `id, ts, section, issue, cause, fix, outcome, by`:

```markdown
## Entries

- id: rev-0007
  ts: <ISO-8601>
  section: <section id or "global">
  issue: <what was wrong — usually a verbatim assertion diagnostic>
  cause: <root cause, not the symptom — why was it wrong?>
  fix: <the localized change made>
  outcome: <quality delta + which assertions now pass>
  by: <skill or specialist that made the fix>
```

- **cause** must be the **root cause**, not the symptom (per LearningLayer): "the section spec didn't
  require a reflective takeaway," not "reflection missing."
- The applicant is **never** the root cause — point at the process.

## Idempotency rules

- Entries carry a derivable `id` (e.g. hash of `section`+`issue`); re-recording the same event updates
  the existing entry, never duplicates (matches LearningLayer's idempotency_key).
- `source_hashes: []` — it logs across artifacts rather than deriving from one.
- **Never delete history**; supersede with a new entry.

## Example (abbreviated)

```markdown
---
id: revision-history
hash: 88aa
source_hashes: []
updated: 2026-06-23T00:36:00Z
---

## Entries

- id: rev-0007
  ts: 2026-06-23T00:36:00Z
  section: sec-2
  issue: "reflection_present(sec-2): all sentences are event-narration"
  cause: section spec sec-2 omitted a required reflective takeaway
  fix: rewrote spec to require a takeaway; revised sec-2 to add the reflective turn
  outcome: +0.04 overall; reflection_present(sec-2) now passes
  by: review/RevisionLoop
```
