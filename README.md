# EssayOS

[![CI](https://github.com/dhruvaldarji/essayos/actions/workflows/ci.yml/badge.svg)](https://github.com/dhruvaldarji/essayos/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

EssayOS helps you write a strong application essay with an AI agent doing the legwork. It fits any
high-stakes personal essay: college admissions essays, scholarship and grant applications, graduate
school statements of purpose, fellowship and residency applications, job and "why this company"
letters, and award nominations.

You run it inside Claude Code or Codex. It interviews you, organizes what you say into a structure,
drafts the essay in your own voice, and checks that every claim traces back to something real you
told it. The package is plain Markdown and YAML with no runtime dependencies, so the same files run
under any capable agent. Every step is written to disk, so you can stop whenever you want and resume
later from where you left off.

## How it stays honest

EssayOS works from your real experiences. It asks you questions and builds the draft from your
answers, so the result reads like you wrote it. It will not invent a story you never lived, and it
keeps a record linking each claim in the draft to something you actually said.

## Table of contents

- [Installation](#installation)
- [Usage](#usage)
- [What you get](#what-you-get)
- [How it works](#how-it-works)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Installation

### Claude Code

Add the marketplace, install the plugin, and reload:

```text
/plugin marketplace add dhruvaldarji/essayos
/plugin install essayos@dhruvaldarji
/reload-plugins
```

Confirm it loaded:

```text
/plugin list --enabled
```

You now have five commands (`/essayos:essay-init`, `essay-next`, `essay-status`, `essay-resume`,
`essay-lint`) and six reviewer agents (`essayos-program-director`, `essayos-skeptic`, and others).

To pull a newer version later:

```text
/plugin marketplace update dhruvaldarji
/reload-plugins
```

### Codex or any other agent

Clone the repository and point your agent at `AGENTS.md`, which is the entry guide:

```bash
git clone https://github.com/dhruvaldarji/essayos.git
cd essayos
```

Then paste this into your agent session:

```text
Read AGENTS.md and README.md in this repo, then act as my EssayOS orchestrator.
Set up a new essay workspace and start the interview, one question at a time.
```

### Optional Node tooling

A zero-dependency helper (Node 18 or newer) self-tests the package and inspects essay state. The
package runs fine without it.

```bash
npm test                               # structural lint plus fixture assertions
node bin/essayos.mjs lint              # structural check only
node bin/essayos.mjs state <essay-id>  # read an essay's current state
node bin/essayos.mjs assert <essay-id> # run the field-level checks on an essay
```

## Usage

### Quick start in Claude Code

Start an essay:

```text
/essayos:essay-init
```

EssayOS asks you, one question at a time, for the prompt, the kind of essay, the word limit, and
where you are applying. It then creates a workspace and gives you an `essay-id`. Move the essay
forward one step:

```text
/essayos:essay-next my-essay
```

Run `essay-next` again and again. Each run does one piece of work, either an interview question or a
single drafted section, then stops and tells you what comes next. Check where things stand at any
time:

```text
/essayos:essay-status my-essay
```

Keep running `essay-next` until the final review reports `READY_FOR_SUBMISSION: YES`. If you step
away, pick the essay back up:

```text
/essayos:essay-resume my-essay
```

### Commands

| Command | What it does |
|---------|--------------|
| `/essayos:essay-init [type]` | Create a new essay workspace and collect the prompt, type, limit, and target. |
| `/essayos:essay-next <id>` | Advance one step. The orchestrator picks the next skill. |
| `/essayos:essay-status <id>` | Show the phase, artifact status, quality, and next step. |
| `/essayos:essay-resume <id>` | Rebuild state from disk and continue. |
| `/essayos:essay-lint` | Self-check the EssayOS package. |

### Where your work lives

Everything sits under `artifacts/<essay-id>/` as Markdown and YAML: your experiences, the outline,
the drafts, reviewer feedback, and the finished essay. That folder is git-ignored, so your personal
material never gets committed. Because all state is on disk, you can inspect it directly:

```bash
node bin/essayos.mjs state my-essay
# essay:     my-essay
# phase:     writing
# quality:   0.71 / threshold 0.85 / ceiling 0.88
# next:      IncrementalWriter
```

### Driving EssayOS from Codex or any LLM

Point the agent at the repository and paste the block below. It is written to be followed directly by
an LLM that can read and write files.

```text
You are running EssayOS, a Markdown-based essay-writing system in this repository.

1. Read README.md, AGENTS.md, and skills/CONVENTIONS.md.
2. Create artifacts/<essay-id>/ by copying the files from templates/, then write EssayState.md
   with my essay prompt, type, and word limit.
3. Loop: read kernel/Orchestrator.md, look at EssayState.md, choose the next skill, read that
   skill file, and run ONE unit of its work (ask me ONE question, or write ONE section). Repeat.
4. Write one section at a time. Build every claim from something I told you. Ask one question
   per turn.
5. Stop when verification/FinalReviewer.md reports READY_FOR_SUBMISSION: YES.

Start by setting up the workspace and asking me your first question.
```

## What you get

A finished essay plus a full record you can inspect: your experience notes, the chosen narrative
structure, a message map, section specs, the drafts (the best draft is kept separate from the working
copy), feedback from four reviewer personas, a revision log, and quality scores across seven
dimensions (authenticity, specificity, reflection, voice, flow, memorability, and fit). The writing
aims to sound like you, with concrete detail and real reflection.

## How it works

EssayOS is a small kernel plus a library of single-purpose skills that all read and write the same
on-disk files.

- **Kernel** (`kernel/`): the Orchestrator picks the next skill and manages convergence, the
  AssertionEngine runs named quality checks, and the LearningLayer records revisions.
- **Skills** (`discovery/`, `architecture/`, `writing/`, `review/`, `verification/`, `meta/`): each
  one observes state, does a single unit of work, verifies it, and updates state. Each runs on its
  own and never assumes a previous step happened.
- **Specialists** (`specialists/` and `agents/`): reviewer personas such as a program director and a
  skeptic that critique the draft.
- **Artifacts** (`schemas/` and `templates/`): every piece of state is a Markdown file with YAML
  front matter, updated by stable id.

Two rules give EssayOS its operating-system behavior. Artifacts are idempotent, so re-running a step
never duplicates or corrupts state, and changing an earlier answer marks the affected later work
stale. Revision runs on a best-draft ratchet, so a revision is kept only when it scores higher. The
essay never regresses, and the revision loop settles instead of running forever.

A note on the bundled tooling: `bin/essayos.mjs` checks structure and a few fields (word budget,
theme support, claim traceability). It does not prove the ratchet or staleness rules; the agent
upholds those while it runs. Claim traceability confirms a claim maps to something you said. It does
not confirm an outside fact is true, so verify any statistics yourself. The package's own
specification lives in [`ISA.md`](ISA.md).

## Development

```bash
git clone https://github.com/dhruvaldarji/essayos.git
cd essayos
npm test
```

Repository layout:

```
kernel/        Orchestrator, AssertionEngine, LearningLayer
system/        Init, Status, Resume
discovery/     experience elicitation and theme skills
architecture/  narrative structure, message map, outline, section specs
writing/       voice model and the incremental writer plus polish skills
review/        authenticity, committee, revision loop
verification/  consistency, narrative, final review
specialists/   reviewer persona library        agents/  plugin wrappers for those personas
meta/          reusable thinking skills
schemas/       one machine-readable schema per artifact
templates/     blank starters for each artifact
commands/      Claude Code slash commands       .claude-plugin/  plugin and marketplace manifests
bin/           zero-dependency inspector and self-test
tests/         fixtures used by the self-test
```

To add a skill, copy the front matter and body shape from an existing skill (see
`discovery/GrillMe.md`), register it in `skills/SKILLS.md`, and run `npm test`. The linter checks
that every `reads` and `writes` names a real artifact and that every assertion resolves. The contract
every skill follows is in [`skills/CONVENTIONS.md`](skills/CONVENTIONS.md).

## Contributing

Contributions are welcome. Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) and
[`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md). The short version:

- Run `npm test` before opening a pull request. It must report `PASS`.
- Keep skills lean and follow `skills/CONVENTIONS.md`.
- This repository follows [Conventional Commits](https://www.conventionalcommits.org/) (`feat`,
  `test`, `docs`, `ci`, `build`).

## License

[MIT](LICENSE) © Dhruval Darji
