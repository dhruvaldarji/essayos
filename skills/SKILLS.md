# EssayOS Skill Registry

Every skill, its category, and its one-line purpose. All skills obey
[`CONVENTIONS.md`](CONVENTIONS.md). The Orchestrator selects among them; each is also independently
callable.

## Kernel
| Skill | Purpose |
|-------|---------|
| `kernel/Orchestrator` | Read state, find the highest-value gap, select next skill, manage convergence ratchet. |
| `kernel/AssertionEngine` | Define and run the named quality assertions; emit diagnostics; gate UPDATE. |
| `kernel/LearningLayer` | Maintain RevisionHistory + LessonsLearned so mistakes don't recur. |

## System
| Skill | Purpose |
|-------|---------|
| `system/Init` | Create `artifacts/<essay_id>/` from templates; write first EssayState. |
| `system/Status` | Report phase, artifact statuses, quality vs threshold/ceiling, next skill. |
| `system/Resume` | Reconstruct state from disk; route to Orchestrator (proves restartability). |

## Discovery
| Skill | Purpose |
|-------|---------|
| `discovery/GrillMe` | Adaptive one-question-at-a-time interview → ExperienceDatabase. |
| `discovery/ApplicantModel` | Infer values, strengths, identity, motivations, future-physician model. |
| `discovery/ExperienceGraph` | Structure each experience into nine facets; link into a graph. |
| `discovery/ThemeDiscovery` | Infer themes supported by ≥2 experiences; no adjective themes. |

## Architecture
| Skill | Purpose |
|-------|---------|
| `architecture/NarrativeArchitecture` | Select a narrative structure from the evidence. |
| `architecture/ProgramAlignment` | Build Past/Current/Future-Physician/Program-Fit. |
| `architecture/MessageMap` | Fix core message, supporting themes, stories, emotional objectives. |
| `architecture/OutlineGenerator` | Generate section skeletons (no prose). |
| `architecture/SectionSpecifications` | Per-section purpose/evidence/emotion/transition/takeaway. |

## Writing
| Skill | Purpose |
|-------|---------|
| `writing/VoiceModel` | Infer the applicant's voice fingerprint from their own samples. |
| `writing/IncrementalWriter` | Write one section at a time (plan→draft→verify→store); ratchet. |
| `writing/ReflectionEngine` | Raise meaning density (insight>description, growth>accomplishment). |
| `writing/TransitionEngine` | Improve flow between sections. |
| `writing/ConclusionEngine` | Resolve the opening's themes. |

## Review
| Skill | Purpose |
|-------|---------|
| `review/AuthenticityAuditor` | Virtue demonstrated, no clichés, no performative vulnerability. |
| `review/CommitteeReview` | Simulate Program Director / Faculty / Busy Reviewer / Skeptic. |
| `review/RevisionLoop` | Issue→RootCause→Fix→LocalizedRevision→Reverify→History; ratchet. |

## Verification
| Skill | Purpose |
|-------|---------|
| `verification/ConsistencyChecker` | Voice / theme / timeline / identity consistency. |
| `verification/NarrativeVerifier` | Opening resolved, themes recur, future goals, growth visible. |
| `verification/FinalReviewer` | Score 7 dimensions; return READY_FOR_SUBMISSION YES/NO. |

## Meta (thinking capabilities)
| Skill | Purpose |
|-------|---------|
| `meta/Council` | Specialists deliberate independently, then synthesize. |
| `meta/RedTeam` | Attack assumptions, clichés, unsupported claims, weak narratives. |
| `meta/FirstPrinciples` | Reduce to fundamentals; challenge inherited essay assumptions. |
| `meta/ApertureOscillation` | Oscillate macro↔micro across essay/section/paragraph/sentence/word. |
| `meta/RootCauseAnalysis` | Repeated-why on stuck quality scores. |
| `meta/CompressionExpansion` | Compress to core message, expand selectively. |
| `meta/Inversion` | "What would make this fail?" then avoid it. |
| `meta/Counterfactuals` | Explore alternate narrative framings. |
| `meta/MemoryGraph` | Union relationship view over ExperienceGraph + ThemeGraph. |
| `meta/ClaimEvidenceMapper` | Every claim traceable to a real experience (anti-fabrication). |
| `meta/DeliberatePractice` | Improve one dimension at a time. |

## Specialists (agents)
`specialists/NarrativePsychologist`, `specialists/PhysicianMentor`, `specialists/ProgramDirector`,
`specialists/Skeptic`, `specialists/CopyEditor`, `specialists/AuthenticityAuditor` — reusable
reviewer personas invoked by `review/CommitteeReview`, `meta/Council`, and `meta/RedTeam`.
