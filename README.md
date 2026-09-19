# EssayOS

[![CI](https://github.com/dhruvaldarji/essayos/actions/workflows/ci.yml/badge.svg)](https://github.com/dhruvaldarji/essayos/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

EssayOS helps you write a strong application essay with an AI agent doing the legwork. It fits any
high-stakes personal essay. Examples are college admissions essays, scholarship and grant
applications, graduate school statements of purpose, fellowship and residency applications, job
letters, and award nominations.

You run it inside Claude Code or Codex. It interviews you and organizes what you say into a
structure. It drafts the essay in your own voice. It checks that every claim traces back to
something real you told it. It can also review an essay you already wrote. It finds the parts that
sound like a machine and proposes changes you approve one at a time.

The package is plain Markdown and YAML with no runtime dependencies, so the same files run under
any capable agent. Every step is written to disk. You can stop whenever you want and resume later
from where you left off.

## How it stays honest

EssayOS works from your real experiences. It asks you questions and builds the draft from your
answers, so the result reads like you wrote it. It will not invent a story you never lived. It
keeps a record that links each claim in the draft to something you actually said.

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

The plugin bundles two third-party skills: `humanizer` (removes AI writing patterns) and
`simple-english` (plain-English rules for questions and docs), pinned to a tested version. Nothing
else to install. Confirm the install:

```text
/plugin list --enabled
```

You now have seven skills, usable as slash commands (`/essayos:essay-init`, `essay-ingest`,
`essay-scan`, `essay-next`, `essay-status`, `essay-resume`, `essay-lint`), and six reviewer agents
(`essayos-program-director`, `essayos-skeptic`, and others).

To pull a newer version later:

```text
/plugin marketplace update dhruvaldarji
/reload-plugins
```

### Codex

Add this repository as a plugin marketplace, then install the plugin:

```text
codex plugin marketplace add dhruvaldarji/essayos
codex plugin add essayos@essayos
```

The plugin follows the portable Agent Plugins layout: `plugin.json` at the root, a
`.codex-plugin/plugin.json` overlay, and Agent Skills in `skills/`. Codex loads the seven entry
skills above plus pinned copies of `humanizer` and `simple-english`. Say "start a new essay with
EssayOS" or "review my essay with EssayOS" and the matching skill runs.

### Any other agent

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

Run `essay-next` again and again. Each run does one piece of work, then stops and tells you what
comes next. A piece of work is one interview question or one drafted section. Check where things
stand at any time:

```text
/essayos:essay-status my-essay
```

Keep running `essay-next` until the final review reports `READY_FOR_SUBMISSION: YES`. If you step
away, pick the essay back up:

```text
/essayos:essay-resume my-essay
```

### Review an essay you already wrote

If you have a draft, point EssayOS at it:

```text
/essayos:essay-ingest my-essay path/to/draft.md
```

You can also paste the text when it asks. EssayOS stores your draft exactly as given and never
edits that copy. It asks whether you wrote the draft yourself, because that decides whether the
draft counts as a sample of your voice. Then `essay-next` walks the review:

1. It cuts the draft into sections and lists every claim the draft makes.
2. It asks you, one question at a time, for the real story behind each unproven claim.
3. It builds a model of your voice from your answers.
4. It marks every passage that reads like a machine wrote it, and every passage that is flat.
5. It proposes one change at a time. You see the exact before and after, the reason, and the
   experience it draws on. You answer accept, edit, or reject.
6. It applies only what you accepted, and only if the essay scores better.

A change is never invented. If a passage claims something you have not told it about, EssayOS asks
for the story instead of writing one. The goal is an essay that sounds like a person, and that
person is you.

### Commands

Each command is a skill in `skills/`. The same files serve Claude Code and Codex.

| Command | What it does |
|---------|--------------|
| `/essayos:essay-init [type]` | Create a new essay workspace and collect the prompt, type, limit, and target. |
| `/essayos:essay-ingest <id> [path]` | Bring in an essay you already wrote and start the review. |
| `/essayos:essay-scan [id or text]` | Say whether a passage sounds like AI, quoting each tell. No rewrite. |
| `/essayos:essay-next <id>` | Advance one step. The orchestrator picks the next skill. |
| `/essayos:essay-status <id>` | Show the phase, artifact status, quality, and next step. |
| `/essayos:essay-resume <id>` | Rebuild state from disk and continue. |
| `/essayos:essay-lint` | Self-check the EssayOS package. |

### Where your work lives

Everything sits under `artifacts/<essay-id>/` as Markdown and YAML. That includes your experiences,
the outline, the drafts, reviewer feedback, and the finished essay. That folder is git-ignored, so
your personal material never gets committed. Because all state is on disk, you can inspect it
directly:

```bash
node bin/essayos.mjs state my-essay
# essay:     my-essay
# mode:      compose
# phase:     writing
# quality:   0.71 / threshold 0.85 / ceiling 0.88
# next:      IncrementalWriter
```

### Driving EssayOS from any LLM

Point the agent at the repository and paste the block below. It is written to be followed directly
by an LLM that can read and write files.

```text
You are running EssayOS, a Markdown-based essay-writing system in this repository.

1. Read README.md, AGENTS.md, and CONVENTIONS.md.
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

A finished essay plus a full record you can inspect. The record holds your experience notes, the
chosen narrative structure, a message map, and the section specs. It holds the drafts, with the best
draft kept separate from the working copy. It holds feedback from four reviewer personas and a
revision log. It holds quality scores across seven dimensions: authenticity, specificity, reflection,
voice, flow, memorability, and fit. The writing aims to sound like you, with concrete detail and
real reflection.

## How it works

EssayOS is a small kernel plus a library of single-purpose skills that all read and write the same
on-disk files.

- **Kernel** (`kernel/`): the Orchestrator picks the next skill and manages convergence. The
  AssertionEngine runs named quality checks. The LearningLayer records revisions.
- **Skills** (`discovery/`, `architecture/`, `writing/`, `review/`, `verification/`, `meta/`): each
  one observes state, does a single unit of work, verifies it, and updates state. Each runs on its
  own and never assumes a previous step happened.
- **Specialists** (`specialists/` and `agents/`): reviewer personas, such as a program director and
  a skeptic, that critique the draft.
- **Artifacts** (`schemas/` and `templates/`): every piece of state is a Markdown file with YAML
  front matter, updated by stable id.
- **Entry skills** (`skills/essay-*`): the seven commands, in the Agent Skills format. One set of
  files serves Claude Code, Codex, and any other Agent Skills runtime.
- **Third-party skills** (`skills/humanizer`, `skills/simple-english`): pinned copies. The
  writing skills pass every span through `humanizer` with your voice samples as the reference. The
  questions and the reports you read follow `simple-english`. The essay prose never does, because
  that standard flattens text by design.

Two rules give EssayOS its operating-system behavior. Artifacts are idempotent, so re-running a step
never duplicates or corrupts state. Changing an earlier answer marks the affected later work stale.
Revision runs on a best-draft ratchet, so a revision is kept only when it scores higher. The essay
never regresses, and the revision loop settles instead of running forever.

A note on the bundled tooling. `bin/essayos.mjs` checks structure and a few fields: word budget,
theme support, claim traceability, strong AI tells, and sentence rhythm. It does not prove the
ratchet or staleness rules. The agent upholds those while it runs. Claim traceability confirms a
claim maps to something you said. It does not confirm an outside fact is true, so verify any
statistics yourself. The package's own specification lives in [`ISA.md`](ISA.md).

## Development

```bash
git clone https://github.com/dhruvaldarji/essayos.git
cd essayos
npm test
```

Repository layout:

```
kernel/        Orchestrator, AssertionEngine, LearningLayer
system/        Init, Ingest, Status, Resume
discovery/     experience elicitation and theme skills
architecture/  narrative structure, message map, outline, section specs, reverse outline
writing/       voice model and the incremental writer plus polish skills
review/        authenticity, AI-tell scan, committee, personalization, revision loop
verification/  consistency, narrative, final review
specialists/   reviewer persona library        agents/  plugin wrappers for those personas
meta/          reusable thinking skills
schemas/       one machine-readable schema per artifact
templates/     blank starters for each artifact
skills/        entry skills (the commands) + pinned humanizer and simple-english
plugin.json    portable Agent Plugins manifest   .codex-plugin/ Codex overlay   .agents/ Codex marketplace
.claude-plugin/  Claude plugin and marketplace manifests
evals/         behavioral eval suite (claude plugin eval)
bin/           zero-dependency inspector and self-test
tests/         fixtures used by the self-test
```

To add a pipeline skill, copy the front matter and body shape from an existing skill (see
`discovery/GrillMe.md`), register it in `SKILLS.md`, and run `npm test`. The linter checks
that every `reads` and `writes` names a real artifact and that every assertion resolves. The
contract every skill follows is in [`CONVENTIONS.md`](CONVENTIONS.md).

To try a local checkout in Claude Code:

```bash
claude --plugin-dir .
```

To update the pinned third-party skills, run `node bin/essayos.mjs skills-sync --update`, review
the diff, and run `npm test`. This is the only command that uses the network.

## Contributing

Contributions are welcome. Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) and
[`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md). The short version:

- Run `npm test` before opening a pull request. It must report `PASS`.
- Keep skills lean and follow `CONVENTIONS.md`.
- This repository follows [Conventional Commits](https://www.conventionalcommits.org/) (`feat`,
  `test`, `docs`, `ci`, `build`).

## License

[MIT](LICENSE) © Dhruval Darji
