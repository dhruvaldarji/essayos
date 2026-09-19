#!/usr/bin/env node
// EssayOS inspector + self-test. Zero dependencies (Node >=18 stdlib only).
//
// Subcommands:
//   lint                 structural contract check across the package (PASS/FAIL, CI exit code)
//   state <essay_id>     deterministic read-out of an essay's on-disk state
//   assert <essay_id>    run the field-level checks the harness CAN mechanically verify
//   test                 run lint + assert against the bundled fixtures (used by `npm test`)
//   skills-sync [--update]  compare agent-skills/ vendored copies with upstream at the pinned sha
//                        (the only subcommand that touches the network; maintainers only)
//
// SCOPE — read this before trusting the output:
//   `lint`   verifies STRUCTURE: required files exist, skills carry the right front matter and body
//            sections, every reads/writes names a real artifact, every `assert` name resolves.
//   `assert` verifies a SMALL set of FIELD-LEVEL properties on a live essay (word budget, theme
//            support count, claim traceability, strong AI tells, sentence-length variance) by
//            parsing the artifact tables and the best/ draft. The AI-tell and variance checks are
//            the mechanical PROXY for assert ai_tells_absent() / personality_present(); the full
//            assertions are a judge read over the humanizer catalog and the VoiceModel.
//   What is NOT code-enforced: the merge/ratchet/epoch invariants in skills/CONVENTIONS.md are
//   interpreted by the agent at runtime, not proven here. This harness is a structural linter plus a
//   few field checks — it is not a proof checker.
//
// Exit codes: 0 = pass, 1 = a check failed, 2 = usage / missing-input error (never "success on nothing").

import { readFileSync, readdirSync, existsSync, realpathSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const SKILL_DIRS = ['kernel', 'system', 'discovery', 'architecture', 'writing', 'review', 'verification', 'meta'];
const REQ_FM_KEYS = ['skill', 'category', 'purpose', 'reads', 'writes', 'preconditions', 'postconditions', 'idempotency_key', 'asks_questions'];
const REQ_BODY = ['When to run', 'The Loop', 'Assertions', 'Idempotency', 'Output', 'Gotchas'];
const EXTRA_ARTIFACTS = new Set(['MemoryGraph']); // valid artifact without its own schema file

const read = (p) => existsSync(p) ? readFileSync(p, 'utf8').replace(/^﻿/, '').replace(/\r\n/g, '\n') : null;
const lsmd = (dir) => existsSync(join(ROOT, dir)) ? readdirSync(join(ROOT, dir)).filter(f => f.endsWith('.md')) : [];

// Split a file into { fm, body } at the YAML front-matter fence. Correct delimiter handling: body
// starts AFTER the closing `---` line (the prior off-by-delimiter bug sliced by fm length).
function split(text) {
  if (!text || !text.startsWith('---')) return { fm: '', body: text || '' };
  const end = text.indexOf('\n---', 3);
  if (end === -1) return { fm: '', body: text };
  const afterFence = text.indexOf('\n', end + 1);
  return { fm: text.slice(3, end), body: afterFence === -1 ? '' : text.slice(afterFence + 1) };
}

function fmValue(fm, key) {
  const m = fm && fm.match(new RegExp(`^${key}:\\s*(.+?)\\s*(?:#.*)?$`, 'm'));
  return m ? m[1].trim().replace(/^['"]|['"]$/g, '') : null;
}

// Quote-aware list parse for `key: [a, b, "c, d"]` — does not split inside quotes.
function listField(fm, key) {
  const m = fm && fm.match(new RegExp(`^${key}:\\s*\\[([^\\]]*)\\]`, 'm'));
  if (!m) return [];
  const out = []; let cur = '', q = false;
  for (const ch of m[1]) {
    if (ch === '"' || ch === "'") q = !q;
    else if (ch === ',' && !q) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out.map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
}

// Data + header rows of every markdown table in `text`: skips separators and HTML comments.
// (Header rows are returned too; every caller re-filters by an id-prefix or status enum, so the
// header never matches a data check.)
function tableRows(text) {
  const rows = [];
  for (const raw of text.split('\n')) {
    const l = raw.trim();
    if (!l.startsWith('|')) continue;
    if (/^\|[\s:|-]+\|?$/.test(l)) continue;          // separator
    if (l.startsWith('<!--') || l.includes('<!--')) continue;
    const cells = l.split('|').slice(1, -1).map(c => c.trim());
    if (cells.length) rows.push(cells);
  }
  return rows;
}

const knownArtifacts = () => { const s = new Set(EXTRA_ARTIFACTS); for (const f of lsmd('schemas')) s.add(f.replace(/\.md$/, '')); return s; };

function assertionCatalog() {
  const txt = read(join(ROOT, 'kernel', 'AssertionEngine.md')) || '';
  const s = new Set();
  for (const m of txt.matchAll(/assert\s+([a-z][a-z0-9_]*)\s*\(/g)) s.add(m[1]);
  return s;
}

function requiredFiles() {
  const files = [
    'README.md', 'ISA.md', 'AGENTS.md', 'package.json', 'LICENSE', 'CHANGELOG.md',
    '.claude-plugin/plugin.json', '.claude-plugin/marketplace.json',
    '.codex-plugin/plugin.json', '.agents/plugins/marketplace.json',
    'agent-skills/VENDORED.json', 'agent-skills/essayos/SKILL.md', 'agent-skills/essay-ingest/SKILL.md',
    'commands/essay-init.md', 'commands/essay-next.md', 'commands/essay-status.md', 'commands/essay-resume.md', 'commands/essay-lint.md', 'commands/essay-ingest.md', 'commands/essay-scan.md', 'agent-skills/essay-scan/SKILL.md',
    '.github/workflows/ci.yml',
    'skills/CONVENTIONS.md', 'skills/SKILLS.md',
    'kernel/Orchestrator.md', 'kernel/AssertionEngine.md', 'kernel/LearningLayer.md',
    'system/Init.md', 'system/Status.md', 'system/Resume.md', 'system/Ingest.md',
    'architecture/ReverseOutline.md', 'review/AITellScan.md', 'review/PersonalizationReview.md',
    'discovery/GrillMe.md', 'discovery/ApplicantModel.md', 'discovery/ExperienceGraph.md', 'discovery/ThemeDiscovery.md',
    'architecture/NarrativeArchitecture.md', 'architecture/ProgramAlignment.md', 'architecture/MessageMap.md', 'architecture/OutlineGenerator.md', 'architecture/SectionSpecifications.md',
    'writing/VoiceModel.md', 'writing/IncrementalWriter.md', 'writing/ReflectionEngine.md', 'writing/TransitionEngine.md', 'writing/ConclusionEngine.md',
    'review/AuthenticityAuditor.md', 'review/CommitteeReview.md', 'review/RevisionLoop.md',
    'verification/ConsistencyChecker.md', 'verification/NarrativeVerifier.md', 'verification/FinalReviewer.md',
    'specialists/NarrativePsychologist.md', 'specialists/PhysicianMentor.md', 'specialists/ProgramDirector.md', 'specialists/Skeptic.md', 'specialists/CopyEditor.md', 'specialists/AuthenticityAuditor.md',
    'meta/Council.md', 'meta/RedTeam.md', 'meta/FirstPrinciples.md', 'meta/ApertureOscillation.md', 'meta/RootCauseAnalysis.md', 'meta/CompressionExpansion.md', 'meta/Inversion.md', 'meta/Counterfactuals.md', 'meta/MemoryGraph.md', 'meta/ClaimEvidenceMapper.md', 'meta/DeliberatePractice.md',
  ];
  for (const a of ['EssayState','Requirements','ApplicantModel','ExperienceDatabase','ExperienceGraph','ThemeGraph','NarrativeModel','ProgramFitModel','MessageMap','Outline','SectionSpecifications','VoiceModel','Drafts','ReviewerFeedback','RevisionHistory','QualityMetrics','LessonsLearned','ClaimEvidenceMap','IngestReport']) {
    files.push(`schemas/${a}.md`, `templates/${a}.md`);
  }
  return files;
}


// ---------------------------------------------------------------------------------------------
// Manifest + packaging checks (ISC-123..): the Claude and Codex manifests, the vendored skills, the
// entry skills, the eval suite, and the plain-English docs. Each returns an array of error strings.
// ---------------------------------------------------------------------------------------------

function readJson(rel) {
  const txt = read(join(ROOT, rel));
  if (txt === null) return { err: `missing required file: ${rel}` };
  try { return { json: JSON.parse(txt) }; } catch (e) { return { err: `${rel}: invalid JSON (${e.message})` }; }
}

const SHA40 = /^[0-9a-f]{40}$/;
const KEBAB = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

function lintManifests() {
  const errors = [];
  const pkg = readJson('package.json'), cp = readJson('.claude-plugin/plugin.json'), cm = readJson('.claude-plugin/marketplace.json');
  const xp = readJson('.codex-plugin/plugin.json'), xm = readJson('.agents/plugins/marketplace.json');
  for (const r of [pkg, cp, cm, xp, xm]) if (r.err) errors.push(r.err);
  if (errors.length) return errors;
  const v = pkg.json.version;
  const claudeEntry = (cm.json.plugins || []).find(p => p.name === 'essayos');
  if (cp.json.version !== v) errors.push(`.claude-plugin/plugin.json: version ${cp.json.version} != package.json ${v}`);
  if (xp.json.version !== v) errors.push(`.codex-plugin/plugin.json: version ${xp.json.version} != package.json ${v}`);
  if (!claudeEntry) errors.push(`.claude-plugin/marketplace.json: no plugin entry named 'essayos'`);
  else if (claudeEntry.version !== v) errors.push(`.claude-plugin/marketplace.json: essayos entry version ${claudeEntry.version} != package.json ${v}`);
  if (cm.json.metadata && cm.json.metadata.version && cm.json.metadata.version !== v) errors.push(`.claude-plugin/marketplace.json: metadata.version ${cm.json.metadata.version} != package.json ${v}`);
  // Claude dependencies must resolve inside this marketplace (Claude resolves a bare name in the
  // declaring plugin's own marketplace) and be pinned to a full commit sha.
  for (const dep of cp.json.dependencies || []) {
    const name = typeof dep === 'string' ? dep : dep.name;
    const entry = (cm.json.plugins || []).find(p => p.name === name);
    if (!entry) { errors.push(`.claude-plugin/plugin.json: dependency '${name}' has no entry in .claude-plugin/marketplace.json`); continue; }
    const src = entry.source;
    if (!src || typeof src !== 'object' || src.source !== 'github' || !src.repo) errors.push(`.claude-plugin/marketplace.json: '${name}' must use a github source object with repo`);
    else if (!SHA40.test(src.sha || '')) errors.push(`.claude-plugin/marketplace.json: '${name}' github source is not pinned to a 40-char sha`);
  }
  // Codex manifest shape (openai/codex plugin-json-spec): kebab name, semver, skills path exists,
  // interface.displayName present; every skill dir has SKILL.md whose name matches the dir.
  if (!KEBAB.test(xp.json.name || '')) errors.push(`.codex-plugin/plugin.json: name must be kebab-case`);
  if (xp.json.name !== cp.json.name) errors.push(`.codex-plugin/plugin.json: name '${xp.json.name}' != .claude-plugin name '${cp.json.name}'`);
  if (!/^\d+\.\d+\.\d+/.test(xp.json.version || '')) errors.push(`.codex-plugin/plugin.json: version is not semver`);
  if (!xp.json.description) errors.push(`.codex-plugin/plugin.json: description missing`);
  if (!xp.json.interface || !xp.json.interface.displayName) errors.push(`.codex-plugin/plugin.json: interface.displayName missing`);
  if ((xp.json.interface?.defaultPrompt || []).some(p => p.length > 128) || (xp.json.interface?.defaultPrompt || []).length > 3) errors.push(`.codex-plugin/plugin.json: defaultPrompt is max 3 entries of 128 chars`);
  const skillsPath = xp.json.skills;
  if (typeof skillsPath !== 'string' || !skillsPath.startsWith('./') || skillsPath.includes('..')) errors.push(`.codex-plugin/plugin.json: skills must be a relative './' path inside the plugin`);
  else if (!existsSync(join(ROOT, skillsPath))) errors.push(`.codex-plugin/plugin.json: skills path ${skillsPath} does not exist`);
  else {
    for (const d of readdirSync(join(ROOT, skillsPath))) {
      const dir = join(ROOT, skillsPath, d);
      if (!statSync(dir).isDirectory()) continue;
      const sk = read(join(dir, 'SKILL.md'));
      if (!sk) { errors.push(`${skillsPath}${d}/: missing SKILL.md`); continue; }
      const { fm } = split(sk);
      const name = fmValue(fm, 'name');
      if (name !== d) errors.push(`${skillsPath}${d}/SKILL.md: name '${name}' != directory name`);
      if (!/^description:/m.test(fm)) errors.push(`${skillsPath}${d}/SKILL.md: description missing`);
    }
  }
  for (const c of lsmd('commands')) { const n = c.replace(/\.md$/, ''); if (!existsSync(join(ROOT, skillsPath || './agent-skills/', n, 'SKILL.md'))) errors.push(`commands/${c}: no Codex entry skill at ${skillsPath}${n}/SKILL.md`); }
  const xEntry = (xm.json.plugins || []).find(p => p.name === xp.json.name);
  if (!xm.json.name) errors.push(`.agents/plugins/marketplace.json: name missing`);
  if (!xEntry) errors.push(`.agents/plugins/marketplace.json: no plugin entry named '${xp.json.name}'`);
  else if (!xEntry.source || xEntry.source.source !== 'local' || xEntry.source.path !== './') errors.push(`.agents/plugins/marketplace.json: '${xp.json.name}' source must be {source: local, path: ./}`);
  return errors;
}

function lintVendored() {
  const errors = [];
  const vend = readJson('agent-skills/VENDORED.json'), cm = readJson('.claude-plugin/marketplace.json');
  if (vend.err) return [vend.err];
  for (const sk of vend.json.skills || []) {
    const dir = join(ROOT, 'agent-skills', sk.name);
    if (!SHA40.test(sk.sha || '')) errors.push(`VENDORED.json: ${sk.name} sha is not a 40-char commit sha`);
    for (const local of Object.keys(sk.files || {})) if (!existsSync(join(dir, local))) errors.push(`agent-skills/${sk.name}/${local}: listed in VENDORED.json but missing`);
    if (!existsSync(join(dir, 'LICENSE'))) errors.push(`agent-skills/${sk.name}/LICENSE: missing (third-party skill must ship its license)`);
    // Each vendored skill is also a minimal Claude plugin so a local checkout can satisfy the
    // essayos dependency (claude --plugin-dir, and the eval suite's `plugins:` list).
    const mini = readJson(`agent-skills/${sk.name}/.claude-plugin/plugin.json`);
    if (mini.err) errors.push(mini.err);
    else { if (mini.json.name !== sk.name) errors.push(`agent-skills/${sk.name}/.claude-plugin/plugin.json: name != '${sk.name}'`); if (mini.json.version !== sk.version) errors.push(`agent-skills/${sk.name}/.claude-plugin/plugin.json: version ${mini.json.version} != pin ${sk.version}`); }
    const skill = read(join(dir, 'SKILL.md'));
    if (skill) {
      const { fm } = split(skill);
      const ver = (fm.match(/^\s+version:\s*["']?([^"'\n]+)["']?/m) || [])[1];
      if (ver !== sk.version) errors.push(`agent-skills/${sk.name}/SKILL.md: metadata.version '${ver}' != VENDORED.json pin '${sk.version}'`);
      if (fmValue(fm, 'name') !== sk.name) errors.push(`agent-skills/${sk.name}/SKILL.md: name != '${sk.name}'`);
    }
    // The Claude marketplace must pin the SAME version and sha, so Claude (dependency) and Codex
    // (vendored copy) run identical skill text.
    if (!cm.err) {
      const entry = (cm.json.plugins || []).find(p => p.name === sk.name);
      if (!entry) errors.push(`.claude-plugin/marketplace.json: no entry for vendored skill '${sk.name}'`);
      else {
        if (entry.version !== sk.version) errors.push(`.claude-plugin/marketplace.json: '${sk.name}' version ${entry.version} != VENDORED.json ${sk.version}`);
        if (entry.source?.sha !== sk.sha) errors.push(`.claude-plugin/marketplace.json: '${sk.name}' sha != VENDORED.json sha`);
        if (entry.source?.repo !== sk.repo) errors.push(`.claude-plugin/marketplace.json: '${sk.name}' repo != VENDORED.json repo`);
      }
    }
  }
  return errors;
}

const GRADER_TYPES = new Set(['regex', 'tool_used', 'tool_order', 'file_exists', 'llm', 'baseline']);
const PROMPT_KEYS = new Set(['schema_version', 'name', 'description', 'tags', 'plugins', 'runs', 'expected_outcome', 'model', 'max_turns', 'timeout_seconds', 'allowed_tools', 'append_system_prompt', 'env']);

// The eval suite is the behavioral spec (`claude plugin eval` format). Lint only checks shape:
// every case has a prompt and >=1 grader of a known type; running it needs model credentials.
function lintEvals(minCases = 4) {
  const errors = [];
  const evDir = join(ROOT, 'evals');
  if (!existsSync(evDir)) return [`missing required directory: evals/`];
  let cases = 0;
  for (const d of readdirSync(evDir)) {
    if (['results', 'mocks'].includes(d) || d.startsWith('.')) continue;
    const dir = join(evDir, d);
    if (!statSync(dir).isDirectory()) continue;
    const prompt = read(join(dir, 'prompt.md')), caseYaml = read(join(dir, 'case.yaml'));
    if (!prompt && !caseYaml) { errors.push(`evals/${d}/: no prompt.md or case.yaml`); continue; }
    cases++;
    if (prompt) {
      const { fm, body } = split(prompt);
      for (const m of fm.matchAll(/^([a-z_]+):/gm)) if (!PROMPT_KEYS.has(m[1])) errors.push(`evals/${d}/prompt.md: unknown frontmatter key '${m[1]}'`);
      if (!body.trim()) errors.push(`evals/${d}/prompt.md: empty prompt body`);
    }
    const gdir = join(dir, 'graders');
    const graders = existsSync(gdir) ? readdirSync(gdir).filter(f => f.endsWith('.md')) : [];
    if (!graders.length && !/^graders:/m.test(caseYaml || '')) errors.push(`evals/${d}/: no graders`);
    for (const g of graders) {
      const { fm, body } = split(read(join(gdir, g)));
      const type = fmValue(fm, 'type');
      if (!GRADER_TYPES.has(type)) errors.push(`evals/${d}/graders/${g}: unknown grader type '${type}'`);
      if (type === 'llm' && !body.trim()) errors.push(`evals/${d}/graders/${g}: llm grader has no rubric body`);
      if (type === 'regex' && !/^pattern:/m.test(fm)) errors.push(`evals/${d}/graders/${g}: regex grader has no pattern`);
      if (type === 'tool_used' && !/^tool:/m.test(fm)) errors.push(`evals/${d}/graders/${g}: tool_used grader has no tool`);
    }
  }
  if (cases < minCases) errors.push(`evals/: ${cases} case(s) found, at least ${minCases} required`);
  return errors;
}

// Plain-English check (simple-english / ASD-STE100 spirit) over the user-facing docs: no em-dash,
// no semicolon in prose, no sentence over 25 words. Code, tables, headings, front matter, and
// HTML comments are skipped. The essay prose is never subject to this; only the package docs are.
const PLAIN_DOCS = () => ['README.md', 'AGENTS.md', 'CONTRIBUTING.md', ...lsmd('commands').map(f => `commands/${f}`),
  ...(existsSync(join(ROOT, 'agent-skills')) ? readdirSync(join(ROOT, 'agent-skills')).filter(d => d.startsWith('essay')).map(d => `agent-skills/${d}/SKILL.md`) : [])];
const PLAIN_MAX_WORDS = 25;

function plainSentences(text) {
  const out = [];
  let body = split(text).body.replace(/```[\s\S]*?```/g, '\n').replace(/<!--[\s\S]*?-->/g, '\n');
  const paras = []; let cur = [];
  for (const raw of body.split('\n')) {
    const l = raw.replace(/\s+$/, '');
    const isBreak = !l.trim() || /^\s*(\||#|>|\[!\[)/.test(l) || /^\s*([-*+]|\d+\.)\s/.test(l);
    if (isBreak) { if (cur.length) paras.push(cur.join(' ')); cur = []; }
    if (/^\s*(\||#|>|\[!\[)/.test(l) || !l.trim()) continue;
    cur.push(l.replace(/^\s*([-*+]|\d+\.)\s+/, ''));
  }
  if (cur.length) paras.push(cur.join(' '));
  for (const p of paras) {
    const clean = p.replace(/`[^`]*`/g, 'CODE').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\*\*/g, '').replace(/\((e\.g\.|i\.e\.)[^)]*\)/g, '');
    for (const sent of clean.split(/(?<=[.!?])\s+(?=[A-Z"'(`])/)) out.push(sent.trim());
  }
  return out;
}

function lintPlainDocs() {
  const errors = [];
  for (const rel of PLAIN_DOCS()) {
    const txt = read(join(ROOT, rel));
    if (txt === null) { errors.push(`missing required file: ${rel}`); continue; }
    const body = split(txt).body.replace(/```[\s\S]*?```/g, '');
    body.split('\n').forEach((l, i) => {
      if (/^\s*\|/.test(l) || /<!--/.test(l)) return;
      const stripped = l.replace(/`[^`]*`/g, '');
      if (stripped.includes('—')) errors.push(`${rel}:${i + 1}: em-dash in prose (write two sentences or name the relation)`);
      if (stripped.includes(';')) errors.push(`${rel}:${i + 1}: semicolon in prose (write two sentences)`);
    });
    for (const sent of plainSentences(txt)) {
      const w = sent.split(/\s+/).filter(Boolean).length;
      if (w > PLAIN_MAX_WORDS) errors.push(`${rel}: sentence of ${w} words (max ${PLAIN_MAX_WORDS}): "${sent.slice(0, 70)}..."`);
    }
  }
  return errors;
}

function lint() {
  const errors = [], warn = [];
  const arts = knownArtifacts(), asserts = assertionCatalog();

  for (const f of requiredFiles()) if (!existsSync(join(ROOT, f))) errors.push(`missing required file: ${f}`);

  for (const dir of SKILL_DIRS) {
    for (const f of lsmd(dir)) {
      const rel = `${dir}/${f}`, txt = read(join(ROOT, rel)), { fm, body } = split(txt);
      if (!fm) { errors.push(`${rel}: missing YAML front matter`); continue; }
      for (const k of REQ_FM_KEYS) if (!new RegExp(`^${k}:`, 'm').test(fm)) errors.push(`${rel}: front matter missing '${k}'`);
      if (dir !== 'kernel') for (const s of REQ_BODY) if (!body.includes(s)) errors.push(`${rel}: body missing section '${s}'`);
      for (const a of [...listField(fm, 'reads'), ...listField(fm, 'writes')]) if (!arts.has(a)) errors.push(`${rel}: references unknown artifact '${a}'`);
      // assertion names are snake_case (>=1 underscore); that requirement avoids prose false positives.
      for (const m of body.matchAll(/assert\s+([a-z][a-z0-9]*_[a-z0-9_]*)/g)) if (!asserts.has(m[1])) errors.push(`${rel}: references unknown assertion '${m[1]}'`);
    }
  }

  for (const e of [...lintManifests(), ...lintVendored(), ...lintEvals(), ...lintPlainDocs()]) errors.push(e);

  const guard = (file, needle, label) => { if (!(read(join(ROOT, file)) || '').toLowerCase().includes(needle.toLowerCase())) warn.push(`${file}: expected guard text for ${label} ("${needle}")`); };
  guard('README.md', 'works from your real experiences', 'elicit-not-fabricate');
  guard('writing/IncrementalWriter.md', 'one section', 'one-section-at-a-time');
  guard('skills/CONVENTIONS.md', 'one', 'one-question-at-a-time');
  guard('discovery/ThemeDiscovery.md', '2', 'theme >=2 experiences');
  guard('system/Ingest.md', 'never rewrites', 'ingest-never-rewrites');
  guard('review/PersonalizationReview.md', 'no source experience, no rewrite', 'no-source-no-rewrite');
  guard('skills/CONVENTIONS.md', 'the essay prose, ever', 'simple-english-never-on-essay');

  const ok = errors.length === 0;
  console.log(`EssayOS lint: ${ok ? 'PASS' : 'FAIL'}  (${errors.length} errors, ${warn.length} warnings)`);
  for (const e of errors) console.log(`  ERROR  ${e}`);
  for (const w of warn) console.log(`  WARN   ${w}`);
  return ok;
}

// Reject anything that could escape the artifacts/ root (path traversal via the essay_id argument).
function safeId(id) {
  if (!id || /[\/\\]/.test(id) || id.includes('..') || id.startsWith('.')) {
    console.error(`invalid essay_id: ${JSON.stringify(id)} (no slashes, no "..", no leading dot)`);
    process.exit(2);
  }
  return id;
}

// Resolve the workspace dir AND confirm it really lives inside artifacts/ — a symlink planted at
// artifacts/<id> (e.g. pulled via git) could otherwise redirect reads outside the repo.
function safeEssayDir(id) {
  const dir = join(ROOT, 'artifacts', safeId(id));
  if (existsSync(dir)) {
    const base = realpathSync(join(ROOT, 'artifacts'));
    const real = realpathSync(dir);
    if (real !== base && !real.startsWith(base + sep)) { console.error(`essay_id escapes artifacts/: ${id}`); process.exit(2); }
  }
  return dir;
}

function state(id) {
  if (!id) { console.error('usage: essayos state <essay_id>'); process.exit(2); }
  const dir = safeEssayDir(id);
  const txt = read(join(dir, 'EssayState.md'));
  if (!txt) { console.error(`no EssayState for '${id}' at ${dir}`); process.exit(2); }
  const { fm } = split(txt);
  console.log(`essay:     ${id}`);
  console.log(`type:      ${fmValue(fm, 'essay_type')}`);
  console.log(`mode:      ${fmValue(fm, 'mode') || 'compose'}`);
  console.log(`phase:     ${fmValue(fm, 'phase')}`);
  console.log(`status:    ${fmValue(fm, 'status')}`);
  console.log(`quality:   ${fmValue(fm, 'quality_overall')} / threshold ${fmValue(fm, 'quality_threshold')} / ceiling ${fmValue(fm, 'quality_ceiling')}`);
  console.log(`converged: ${fmValue(fm, 'converged')}`);
  console.log(`next:      ${fmValue(fm, 'next_skill')}`);
  const counts = {};
  for (const cells of tableRows(txt)) { const s = cells[2]; if (s && ['ok','thin','stale','missing'].includes(s)) counts[s] = (counts[s] || 0) + 1; }
  console.log(`artifacts: ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ') || 'none tracked'}`);
}

const wordCount = (text) => text.replace(/```[\s\S]*?```/g, ' ').replace(/<!--[\s\S]*?-->/g, ' ').replace(/[#>*_`|-]/g, ' ').split(/\s+/).filter(w => /[a-z0-9]/i.test(w)).length;

// Extract ONLY the `## best/` section text (the published draft). Counting the whole Drafts.md body
// double-counts the working/ copy and any scaffolding prose, which wrongly inflated word_budget.
function bestDraftText(draftTxt) {
  const body = split(draftTxt).body;
  for (const seg of body.split(/\n##\s+/)) {
    if (/^best\b/i.test(seg.trim())) return seg.slice(seg.indexOf('\n') + 1); // drop the "best/" header line
  }
  return body; // no best/ section -> fall back to whole body
}


// ---------------------------------------------------------------------------------------------
// Mechanical proxies for assert ai_tells_absent() and assert personality_present().
// Patterns follow the vendored humanizer catalog (agent-skills/humanizer/SKILL.md, v3.0.0):
// STRONG = §1–§5 (one sighting justifies an edit); WEAK = §6–§18 stock words (need company).
// The proxy is deliberately narrow (few false positives); the judge read in the skill is broader.
// ---------------------------------------------------------------------------------------------
const AI_STRONG = [
  ['§1 not-X-but-Y', /\bnot (?:just|only|merely|simply) \b[^.!?]{1,80}?\bbut\b/i],
  ['§1 it\'s-not-X-it\'s-Y', /\b(?:it|this|that)(?:'s| is)(?:n't| not) (?:about |just )?[^.!?]{1,60}?[,;] (?:it|this|that)(?:'s| is)\b/i],
  ['§2 one-line closer', /\b(?:let that sink in|read that again|that(?:'s| is) the real win)\b/i],
  ['§3 deep-sounding saying', /\b(?:the real question is|at its core|what really matters|the heart of the matter|the deeper issue|nothing short of)\b/i],
  ['§4 staged run-up', /\b(?:let'?s dive in|let'?s dive into|let'?s explore|without further ado|here'?s the thing|the thing is,)/i],
  ['§5 arguing with no one', /\b(?:i'?m not saying|to be clear,|don'?t get me wrong|this is not to say|some might say)\b/i],
];
const AI_WEAK = /\b(?:delv(?:e|ed|ing)|tapestry|testament to|underscor(?:e|es|ed|ing)|multifaceted|pivotal|beacon|embark(?:ed|ing)? (?:on|upon)|foster(?:ed|ing)?|leverag(?:e|ed|ing)|navigat(?:e|ed|ing) the (?:complex|challeng)\w*|deeply resonat\w*|resonated deeply|crucial|it is worth noting|in today'?s (?:fast-paced|ever-changing)|landscape of|realm of|game-?changer|unwavering|profound(?:ly)?|transformative|a journey of|vibrant|deeply passionate)\b/gi;

function aiTells(text) {
  const strong = [], weak = [];
  for (const [name, re] of AI_STRONG) { const m = text.match(re); if (m) strong.push(`${name}: "${m[0].slice(0, 60)}"`); }
  for (const m of text.matchAll(AI_WEAK)) weak.push(m[0]);
  const dashes = (text.match(/—|--/g) || []).length;
  if (dashes >= 3) weak.push(`${dashes} dashes`);
  return { strong, weak };
}

function sentencesOf(text) {
  return text.replace(/\s+/g, ' ').split(/(?<=[.!?]["')]?)\s+(?=["'(]?[A-Z])/).map(s => s.trim()).filter(s => /[a-z]/i.test(s));
}

function sentenceVariance(text) {
  const sents = sentencesOf(text);
  const lens = sents.map(s => s.split(/\s+/).filter(Boolean).length);
  const n = lens.length;
  if (n < 4) return { n, skip: true };
  const mean = lens.reduce((a, b) => a + b, 0) / n;
  const stdev = Math.sqrt(lens.reduce((a, b) => a + (b - mean) ** 2, 0) / n);
  let run = 1, maxRun = 1, runWord = '';
  for (let i = 1; i < sents.length; i++) {
    const a = sents[i - 1].split(/\s+/)[0].toLowerCase().replace(/[^a-z']/g, ''), b = sents[i].split(/\s+/)[0].toLowerCase().replace(/[^a-z']/g, '');
    if (a === b) { run++; if (run > maxRun) { maxRun = run; runWord = b; } } else run = 1;
  }
  return { n, stdev, min: Math.min(...lens), max: Math.max(...lens), maxRun, runWord, skip: false };
}
const VARIANCE_FLOOR = 4.0, OPENER_RUN_MAX = 3;

// Run the mechanically-checkable assertions against a live essay directory.
// Returns {pass, fail, error, lines}. A missing required input is an ERROR (never a silent pass).
function runAsserts(dir) {
  const out = { pass: 0, fail: 0, error: 0, skip: 0, lines: [] };
  const add = (tag, name, detail) => { out.lines.push(`  ${tag}  ${name}: ${detail}`); if (tag === 'PASS') out.pass++; else if (tag === 'FAIL') out.fail++; else if (tag === 'SKIP') out.skip++; else out.error++; };

  // word_budget
  const reqTxt = read(join(dir, 'Requirements.md')), draftTxt = read(join(dir, 'Drafts.md'));
  if (!reqTxt || !draftTxt) add('ERROR', 'word_budget', 'Requirements.md or Drafts.md missing');
  else {
    const limit = Number(fmValue(split(reqTxt).fm, 'word_limit'));
    if (!limit) add('ERROR', 'word_budget', 'Requirements.word_limit not set');
    else { const w = wordCount(bestDraftText(draftTxt)); add(w <= limit ? 'PASS' : 'FAIL', 'word_budget', `${w} words vs limit ${limit} (best/ draft)`); }
  }

  // ai_tells — proxy for assert ai_tells_absent(): any strong tell, or >=3 weak tells, fails.
  if (!draftTxt) add('ERROR', 'ai_tells', 'Drafts.md missing');
  else {
    const prose = bestDraftText(draftTxt).replace(/<!--[\s\S]*?-->/g, ' ').replace(/^\s*[#>|].*$/gm, ' ');
    const { strong, weak } = aiTells(prose);
    const bad = strong.length > 0 || weak.length >= 3;
    add(bad ? 'FAIL' : 'PASS', 'ai_tells', bad ? `${strong.length} strong, ${weak.length} weak — ${[...strong, ...(weak.length ? [`weak: ${weak.slice(0, 6).join(', ')}`] : [])].join(' · ')}` : `${strong.length} strong, ${weak.length} weak (best/ draft)`);
  }

  // sentence_variance — proxy for the rhythm half of assert personality_present(): monotone fails.
  if (!draftTxt) add('ERROR', 'sentence_variance', 'Drafts.md missing');
  else {
    const prose = bestDraftText(draftTxt).replace(/<!--[\s\S]*?-->/g, ' ').replace(/^\s*[#>|].*$/gm, ' ');
    const v = sentenceVariance(prose);
    if (v.skip) add('SKIP', 'sentence_variance', `${v.n} sentence(s); fewer than 4, variance not judged`);
    else {
      const monotone = v.stdev < VARIANCE_FLOOR, run = v.maxRun > OPENER_RUN_MAX;
      add(monotone || run ? 'FAIL' : 'PASS', 'sentence_variance', `${v.n} sentences, ${v.min}–${v.max} words, stdev ${v.stdev.toFixed(1)} (floor ${VARIANCE_FLOOR})` + (run ? `; ${v.maxRun} in a row open with "${v.runWord}"` : ''));
    }
  }

  // theme_supported — each theme row needs >=2 ids in the supporting_exps column
  const themeTxt = read(join(dir, 'ThemeGraph.md'));
  if (!themeTxt) add('ERROR', 'theme_supported', 'ThemeGraph.md missing');
  else {
    const rows = tableRows(themeTxt).filter(c => c[0] && /^thm/i.test(c[0]));
    if (!rows.length) add('ERROR', 'theme_supported', 'no theme rows found');
    else {
      const weak = rows.filter(c => ((c[3] || '').match(/exp[-\w]+/gi) || []).length < 2);
      add(weak.length === 0 ? 'PASS' : 'FAIL', 'theme_supported', weak.length ? `${weak.length} theme(s) with <2 supporting exps: ${weak.map(c => c[0]).join(', ')}` : `all ${rows.length} themes have >=2`);
    }
  }

  // claim_traceable — unsupported_count must be 0 and no claim row marked unsupported
  const cemTxt = read(join(dir, 'ClaimEvidenceMap.md'));
  if (!cemTxt) add('ERROR', 'claim_traceable', 'ClaimEvidenceMap.md missing');
  else {
    const unsupported = Number(fmValue(split(cemTxt).fm, 'unsupported_count') || 0);
    const rows = tableRows(cemTxt).filter(c => c[0] && /^clm/i.test(c[0]));
    const badRows = rows.filter(c => /^(no|false)$/i.test(c[4] || ''));
    const bad = unsupported > 0 || badRows.length > 0;
    add(bad ? 'FAIL' : 'PASS', 'claim_traceable', bad ? `${Math.max(unsupported, badRows.length)} untraceable claim(s)` : `${rows.length} claims all traceable`);
  }
  return out;
}

function assertEssay(id) {
  if (!id) { console.error('usage: essayos assert <essay_id>'); process.exit(2); }
  const dir = safeEssayDir(id);
  if (!existsSync(dir)) { console.error(`no essay workspace at ${dir}`); process.exit(2); }
  const r = runAsserts(dir);
  for (const l of r.lines) console.log(l);
  process.exit(r.error ? 2 : r.fail ? 1 : 0);
}

// Self-test: lint must pass, the clean fixture must pass all asserts, the broken fixture must fail.
function selftest() {
  let ok = lint();
  const clean = join(ROOT, 'tests', 'fixtures', 'clean'), broken = join(ROOT, 'tests', 'fixtures', 'broken');
  if (existsSync(clean)) {
    const r = runAsserts(clean);
    const good = r.fail === 0 && r.error === 0 && r.pass >= 5;
    console.log(`fixture clean:  ${good ? 'PASS' : 'FAIL'} (${r.pass} pass, ${r.fail} fail, ${r.error} error)`);
    r.lines.forEach(l => { if (!l.includes('PASS')) console.log(l); });
    ok = ok && good;
  } else { console.log('fixture clean:  MISSING'); ok = false; }
  if (existsSync(broken)) {
    const r = runAsserts(broken);
    const good = r.fail >= 1; // the broken fixture MUST trip at least one real check
    console.log(`fixture broken: ${good ? 'PASS (correctly failed)' : 'FAIL (did not catch the planted defects)'} (${r.fail} fail, ${r.error} error)`);
    ok = ok && good;
  } else { console.log('fixture broken: MISSING'); ok = false; }
  const ai = join(ROOT, 'tests', 'fixtures', 'ai-sounding');
  if (existsSync(ai)) {
    const r = runAsserts(ai);
    // The planted defects are ONLY in the prose: the AI-tell and variance proxies must both trip,
    // and nothing else may (proves the checks isolate the defect rather than failing on noise).
    const tripped = r.lines.filter(l => l.includes('FAIL')).map(l => l.trim().split(/\s+/)[1].replace(':', ''));
    const good = tripped.includes('ai_tells') && tripped.includes('sentence_variance') && tripped.length === 2 && r.error === 0;
    console.log(`fixture ai-sounding: ${good ? 'PASS (correctly failed ai_tells + sentence_variance only)' : 'FAIL (tripped: ' + tripped.join(', ') + ')'}`);
    r.lines.forEach(l => { if (l.includes('FAIL')) console.log(l); });
    ok = ok && good;
  } else { console.log('fixture ai-sounding: MISSING'); ok = false; }
  console.log(`EssayOS selftest: ${ok ? 'PASS' : 'FAIL'}`);
  process.exit(ok ? 0 : 1);
}


// skills-sync: the one network-touching subcommand. Verifies agent-skills/ copies equal upstream at
// the pinned sha; reports the newest upstream version; --update pulls main and rewrites the pins in
// VENDORED.json and .claude-plugin/marketplace.json so Claude (dependency) and Codex (vendored copy)
// stay on the same version. Maintainers only; the package never needs the network at runtime.
async function skillsSync(update) {
  const vendPath = join(ROOT, 'agent-skills', 'VENDORED.json');
  const vend = JSON.parse(read(vendPath));
  const mktPath = join(ROOT, '.claude-plugin', 'marketplace.json');
  const mkt = JSON.parse(read(mktPath));
  const raw = async (repo, ref, path) => { const r = await fetch(`https://raw.githubusercontent.com/${repo}/${ref}/${path}`); if (!r.ok) throw new Error(`${repo}@${ref}:${path} -> HTTP ${r.status}`); return (await r.text()).replace(/\r\n/g, '\n'); };
  // Resolve upstream main without the GitHub API (which some proxies block): git's smart-HTTP
  // ref advertisement is a plain GET and lists every ref with its sha.
  const headSha = async (repo) => {
    const r = await fetch(`https://github.com/${repo}.git/info/refs?service=git-upload-pack`, { headers: { 'user-agent': 'essayos-skills-sync' } });
    if (!r.ok) throw new Error(`${repo} info/refs -> HTTP ${r.status}`);
    const m = (await r.text()).match(/([0-9a-f]{40}) refs\/heads\/main\b/);
    if (!m) throw new Error(`${repo}: refs/heads/main not advertised`);
    return m[1];
  };
  let drift = 0, lookupFailed = 0;
  for (const sk of vend.skills) {
    const dir = join(ROOT, 'agent-skills', sk.name);
    for (const [local, remote] of Object.entries(sk.files)) {
      const pinned = await raw(sk.repo, sk.sha, remote);
      const ours = read(join(dir, local));
      const same = ours !== null && ours === pinned;
      if (!same) drift++;
      console.log(`  ${same ? 'OK   ' : 'DRIFT'}  agent-skills/${sk.name}/${local}  (pinned ${sk.sha.slice(0, 12)})`);
    }
    let latestSha, latestVer;
    try {
      latestSha = await headSha(sk.repo);
      const latestSkill = await raw(sk.repo, latestSha, sk.files['SKILL.md']);
      latestVer = (split(latestSkill).fm.match(/^\s+version:\s*["']?([^"'\n]+)["']?/m) || [])[1];
      console.log(`  ${sk.name}: pinned ${sk.version} @ ${sk.sha.slice(0, 12)} · upstream main ${latestVer} @ ${latestSha.slice(0, 12)}${latestSha === sk.sha ? ' (up to date)' : ' (newer available)'}`);
    } catch (e) {
      lookupFailed++;
      console.log(`  ${sk.name}: pinned ${sk.version} @ ${sk.sha.slice(0, 12)} · upstream lookup failed (${e.message})`);
      continue;
    }
    if (update && latestSha !== sk.sha) {
      for (const [local, remote] of Object.entries(sk.files)) { mkdirSync(dirname(join(dir, local)), { recursive: true }); writeFileSync(join(dir, local), await raw(sk.repo, latestSha, remote)); }
      sk.sha = latestSha; sk.version = latestVer; sk.ref = 'main';
      const entry = mkt.plugins.find(p => p.name === sk.name);
      if (entry) { entry.version = latestVer; entry.source.sha = latestSha; entry.source.ref = 'main'; entry.description = entry.description.replace(/Pinned to upstream .*$/, `Pinned to upstream ${latestVer}.`); }
      console.log(`  UPDATED ${sk.name} -> ${latestVer} @ ${latestSha.slice(0, 12)} (re-run lint, review the diff, then commit)`);
    }
  }
  if (update) { writeFileSync(vendPath, JSON.stringify(vend, null, 2) + '\n'); writeFileSync(mktPath, JSON.stringify(mkt, null, 2) + '\n'); }
  console.log(`skills-sync: ${drift ? `${drift} file(s) drifted from the pinned sha` : 'vendored copies match the pinned sha'}${lookupFailed ? ` · ${lookupFailed} upstream lookup(s) failed (pins still verified)` : ''}`);
  return drift === 0;
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === 'lint') process.exit(lint() ? 0 : 1);
else if (cmd === 'state') state(arg);
else if (cmd === 'assert') assertEssay(arg);
else if (cmd === 'test' || cmd === 'selftest') selftest();
else if (cmd === 'skills-sync') skillsSync(arg === '--update').then(ok => process.exit(ok ? 0 : 1)).catch(e => { console.error(`skills-sync: ${e.message}`); process.exit(2); });
else { console.log('EssayOS inspector\n  essayos lint                 structural self-test of the package (manifests, skills, docs, evals shape)\n  essayos state <id>          inspect an essay\n  essayos assert <id>         run field-level checks on an essay (word budget, themes, claims, AI tells, rhythm)\n  essayos test                lint + fixture asserts (npm test)\n  essayos skills-sync [--update]  compare vendored agent-skills with upstream (network; maintainers)'); process.exit(cmd ? 2 : 0); }
