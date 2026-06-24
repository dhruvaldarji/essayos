#!/usr/bin/env node
// EssayOS inspector + self-test. Zero dependencies (Node >=18 stdlib only).
//
// Subcommands:
//   lint                 structural contract check across the package (PASS/FAIL, CI exit code)
//   state <essay_id>     deterministic read-out of an essay's on-disk state
//   assert <essay_id>    run the field-level checks the harness CAN mechanically verify
//   test                 run lint + assert against the bundled fixtures (used by `npm test`)
//
// SCOPE — read this before trusting the output:
//   `lint`   verifies STRUCTURE: required files exist, skills carry the right front matter and body
//            sections, every reads/writes names a real artifact, every `assert` name resolves.
//   `assert` verifies a SMALL set of FIELD-LEVEL properties on a live essay (word budget, theme
//            support count, claim traceability) by parsing the artifact tables.
//   What is NOT code-enforced: the merge/ratchet/epoch invariants in skills/CONVENTIONS.md are
//   interpreted by the agent at runtime, not proven here. This harness is a structural linter plus a
//   few field checks — it is not a proof checker.
//
// Exit codes: 0 = pass, 1 = a check failed, 2 = usage / missing-input error (never "success on nothing").

import { readFileSync, readdirSync, existsSync, realpathSync } from 'node:fs';
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
    'README.md', 'ISA.md', 'AGENTS.md', 'package.json', 'LICENSE',
    '.claude-plugin/plugin.json', 'skills/CONVENTIONS.md', 'skills/SKILLS.md',
    'kernel/Orchestrator.md', 'kernel/AssertionEngine.md', 'kernel/LearningLayer.md',
    'system/Init.md', 'system/Status.md', 'system/Resume.md',
    'discovery/GrillMe.md', 'discovery/ApplicantModel.md', 'discovery/ExperienceGraph.md', 'discovery/ThemeDiscovery.md',
    'architecture/NarrativeArchitecture.md', 'architecture/ProgramAlignment.md', 'architecture/MessageMap.md', 'architecture/OutlineGenerator.md', 'architecture/SectionSpecifications.md',
    'writing/VoiceModel.md', 'writing/IncrementalWriter.md', 'writing/ReflectionEngine.md', 'writing/TransitionEngine.md', 'writing/ConclusionEngine.md',
    'review/AuthenticityAuditor.md', 'review/CommitteeReview.md', 'review/RevisionLoop.md',
    'verification/ConsistencyChecker.md', 'verification/NarrativeVerifier.md', 'verification/FinalReviewer.md',
    'specialists/NarrativePsychologist.md', 'specialists/PhysicianMentor.md', 'specialists/ProgramDirector.md', 'specialists/Skeptic.md', 'specialists/CopyEditor.md', 'specialists/AuthenticityAuditor.md',
    'meta/Council.md', 'meta/RedTeam.md', 'meta/FirstPrinciples.md', 'meta/ApertureOscillation.md', 'meta/RootCauseAnalysis.md', 'meta/CompressionExpansion.md', 'meta/Inversion.md', 'meta/Counterfactuals.md', 'meta/MemoryGraph.md', 'meta/ClaimEvidenceMapper.md', 'meta/DeliberatePractice.md',
  ];
  for (const a of ['EssayState','Requirements','ApplicantModel','ExperienceDatabase','ExperienceGraph','ThemeGraph','NarrativeModel','ProgramFitModel','MessageMap','Outline','SectionSpecifications','VoiceModel','Drafts','ReviewerFeedback','RevisionHistory','QualityMetrics','LessonsLearned','ClaimEvidenceMap']) {
    files.push(`schemas/${a}.md`, `templates/${a}.md`);
  }
  return files;
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

  const guard = (file, needle, label) => { if (!(read(join(ROOT, file)) || '').toLowerCase().includes(needle.toLowerCase())) warn.push(`${file}: expected guard text for ${label} ("${needle}")`); };
  guard('README.md', 'works from your real experiences', 'elicit-not-fabricate');
  guard('writing/IncrementalWriter.md', 'one section', 'one-section-at-a-time');
  guard('skills/CONVENTIONS.md', 'one', 'one-question-at-a-time');
  guard('discovery/ThemeDiscovery.md', '2', 'theme >=2 experiences');

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

// Run the mechanically-checkable assertions against a live essay directory.
// Returns {pass, fail, error, lines}. A missing required input is an ERROR (never a silent pass).
function runAsserts(dir) {
  const out = { pass: 0, fail: 0, error: 0, lines: [] };
  const add = (tag, name, detail) => { out.lines.push(`  ${tag}  ${name}: ${detail}`); if (tag === 'PASS') out.pass++; else if (tag === 'FAIL') out.fail++; else out.error++; };

  // word_budget
  const reqTxt = read(join(dir, 'Requirements.md')), draftTxt = read(join(dir, 'Drafts.md'));
  if (!reqTxt || !draftTxt) add('ERROR', 'word_budget', 'Requirements.md or Drafts.md missing');
  else {
    const limit = Number(fmValue(split(reqTxt).fm, 'word_limit'));
    if (!limit) add('ERROR', 'word_budget', 'Requirements.word_limit not set');
    else { const w = wordCount(bestDraftText(draftTxt)); add(w <= limit ? 'PASS' : 'FAIL', 'word_budget', `${w} words vs limit ${limit} (best/ draft)`); }
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
    const good = r.fail === 0 && r.error === 0 && r.pass >= 3;
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
  console.log(`EssayOS selftest: ${ok ? 'PASS' : 'FAIL'}`);
  process.exit(ok ? 0 : 1);
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === 'lint') process.exit(lint() ? 0 : 1);
else if (cmd === 'state') state(arg);
else if (cmd === 'assert') assertEssay(arg);
else if (cmd === 'test' || cmd === 'selftest') selftest();
else { console.log('EssayOS inspector\n  essayos lint            structural self-test of the package\n  essayos state <id>     inspect an essay\n  essayos assert <id>    run field-level checks on an essay\n  essayos test           lint + fixture asserts (npm test)'); process.exit(cmd ? 2 : 0); }
