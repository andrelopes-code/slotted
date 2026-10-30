#!/usr/bin/env node
/**
 * Runs the agent-material evaluation: each case, per binding, with and without
 * the snippet, `runs` times, through `claude -p`, in a fresh copy of a fixture
 * that installs the beta tarballs of `demos/.registry`; a case with a `seed`
 * starts from `eval/seeds/<seed>/<binding>/`, copied over `src/`.
 *   pnpm eval:agent-docs --dry-run
 *   pnpm eval:agent-docs --case orders-list --binding react --runs 1 --condition with
 *   pnpm eval:agent-docs --case orders-list --binding react --runs 1 --condition with --keep
 *     (keeps each session's directory and prints its path)
 *   pnpm eval:agent-docs --jobs 2   (sessions at once; 4 by default)
 *   pnpm eval:agent-docs --fresh    (ignores the journal of an interrupted run)
 * Prerequisite: `node scripts/pack-beta.mjs --only @slotted/react,@slotted/angular,@slotted/core,@slotted/theme,@slotted/themes`.
 */
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  appendFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { assertionPasses, familyComponents } from '../src/eval/assertions.ts';
import { parseStream, triggered } from '../src/eval/stream.ts';
import { renderReport, summarize } from '../src/eval/summary.ts';
import { renderAgentsSnippet } from '../src/render.ts';

const root = resolve(import.meta.dirname, '../../..');
const evalDir = resolve(import.meta.dirname, '../eval');
const { values } = parseArgs({
  options: {
    case: { type: 'string' },
    binding: { type: 'string' },
    condition: { type: 'string' },
    runs: { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
    keep: { type: 'boolean', default: false },
    jobs: { type: 'string', default: '4' },
    fresh: { type: 'boolean', default: false },
  },
});

const config = JSON.parse(readFileSync(join(evalDir, 'cases.json'), 'utf8'));
const runs = Number(values.runs ?? config.runs);
const bindings = values.binding ? [values.binding] : config.bindings;
const conditions = values.condition ? [values.condition] : ['with', 'without'];
const cases = config.cases.filter((entry) => !values.case || entry.id === values.case);
if (!(Number(values.jobs) >= 1)) throw new Error(`--jobs must be 1 or more, not ${values.jobs}`);
const sessions = bindings.length * cases.length * runs * conditions.length;
console.log(`${sessions} session(s), model ${config.model}`);
if (values['dry-run']) process.exit(0);

const registry = JSON.parse(readFileSync(join(root, 'demos/.registry/index.json'), 'utf8'));
const PACKAGES = {
  react: ['@slotted/react', '@slotted/core', '@slotted/theme', '@slotted/themes'],
  angular: ['@slotted/angular', '@slotted/core', '@slotted/theme', '@slotted/themes'],
};

/** One installed copy per binding; each session copies it. */
function template(binding) {
  const dir = join(tmpdir(), `slotted-eval-${binding}`);
  rmSync(dir, { recursive: true, force: true });
  cpSync(join(evalDir, 'fixtures', binding), dir, { recursive: true });
  const tarballs = PACKAGES[binding].map((name) =>
    join(root, 'demos/.registry', registry[name].tarball),
  );
  const install = spawnSync('npm', ['install', '--no-audit', '--no-fund', ...tarballs], {
    cwd: dir,
    stdio: 'inherit',
  });
  if (install.status !== 0) throw new Error(`npm install failed for ${binding}`);
  return dir;
}

function sourceFiles(dir) {
  const files = new Map();
  const walk = (current) => {
    for (const entry of readdirSync(current)) {
      if (entry === 'node_modules') continue;
      const path = join(current, entry);
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.([cm]?[jt]sx?|html|css|scss|json)$/.test(entry))
        files.set(relative(dir, path), readFileSync(path, 'utf8'));
    }
  };
  walk(join(dir, 'src'));
  return files;
}

const components = new Map(
  readdirSync(join(root, 'packages/react/src'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => [entry.name, join(root, 'packages/react/src', entry.name, 'index.ts')])
    .filter(([, index]) => existsSync(index))
    .map(([family, index]) => [family, familyComponents(readFileSync(index, 'utf8'))]),
);
const SESSION_TIMEOUT_MS = 15 * 60 * 1000;
const env = { ...process.env };
delete env.CLAUDECODE;
// Every install runs before the first session, so a failed one costs no session.
const bases = Object.fromEntries(bindings.map((binding) => [binding, template(binding)]));
const jobs = bindings.flatMap((binding) =>
  cases.flatMap((entry) =>
    conditions.flatMap((condition) =>
      Array.from({ length: runs }, (_, run) => ({ binding, entry, condition, run })),
    ),
  ),
);
const keyOf = ({ binding, entry, condition, run }) =>
  `${binding} ${entry.id} ${condition} #${run + 1}`;

// The journal keeps each finished session, so a run stopped by a usage limit resumes
// where it stopped. A line counts only while the tarballs, the cases, the snippets and
// the model are the ones it was measured on.
const journal = join(tmpdir(), 'slotted-eval-journal.jsonl');
const fingerprint = createHash('sha256')
  .update(config.model)
  .update(readFileSync(join(evalDir, 'cases.json')))
  .update(bindings.map((binding) => renderAgentsSnippet(binding)).join('\n'))
  .update(
    Buffer.concat(
      [...new Set(Object.values(PACKAGES).flat())].map((name) =>
        readFileSync(join(root, 'demos/.registry', registry[name].tarball)),
      ),
    ),
  )
  .digest('hex');
const keys = new Set(jobs.map(keyOf));
const kept =
  values.fresh || !existsSync(journal)
    ? []
    : readFileSync(journal, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line))
        .filter((line) => line.fingerprint === fingerprint && keys.has(line.key));
writeFileSync(journal, kept.map((line) => `${JSON.stringify(line)}\n`).join(''));
const results = kept.map((line) => line.result);
const done = new Set(kept.map((line) => line.key));
const pending = jobs.filter((job) => !done.has(keyOf(job)));
if (kept.length > 0) console.log(`resumed ${kept.length} session(s) from ${journal}`);

/** Resolves with the session's exit status and output; a session past `SESSION_TIMEOUT_MS` is killed. */
function claude(args, cwd) {
  return new Promise((resolveSession) => {
    const child = spawn('claude', args, { cwd, env, timeout: SESSION_TIMEOUT_MS });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.stderr.on('data', (chunk) => (stderr += chunk));
    child.on('close', (status, signal) => resolveSession({ status, signal, stdout, stderr }));
  });
}

async function runSession({ binding, entry, condition, run }) {
  const dir = mkdtempSync(join(tmpdir(), `slotted-eval-${entry.id}-`));
  cpSync(bases[binding], dir, { recursive: true });
  if (entry.seed)
    cpSync(join(evalDir, 'seeds', entry.seed, binding), join(dir, 'src'), { recursive: true });
  writeFileSync(join(dir, 'CLAUDE.md'), condition === 'with' ? renderAgentsSnippet(binding) : '');
  const session = await claude(
    [
      '-p',
      entry.prompt,
      '--output-format',
      'stream-json',
      '--verbose',
      '--model',
      config.model,
      '--setting-sources',
      'project,local',
      '--permission-mode',
      'acceptEdits',
      '--allowedTools',
      'Read,Write,Edit,Glob,Grep,Bash(ls:*),Bash(cat:*)',
    ],
    dir,
  );
  const label = keyOf({ binding, entry, condition, run });
  const trace = parseStream(session.stdout.split('\n'));
  // A session the CLI refused (a usage limit, a login) or that timed out costs nothing usable and must not count.
  if (session.status !== 0 || trace.costUsd === 0)
    throw new Error(
      `${label} did not run (status ${session.status}, signal ${session.signal}): ${(session.stdout + session.stderr).trim().slice(-400)}`,
    );
  const files = sourceFiles(dir);
  const failed = entry.assertions.filter(
    (assertion) => !assertionPasses(assertion, binding, files, components),
  );
  const passed = entry.assertions.length - failed.length;
  const result = {
    caseId: entry.id,
    binding,
    skill: entry.skill,
    condition,
    triggered: triggered(trace, entry.skill),
    passed,
    total: entry.assertions.length,
    trace,
  };
  results.push(result);
  appendFileSync(journal, `${JSON.stringify({ fingerprint, key: label, result })}\n`);
  console.log(
    `${label}: triggered=${triggered(trace, entry.skill)} ${passed}/${entry.assertions.length} $${trace.costUsd.toFixed(2)}${failed.length > 0 ? ` failed: ${failed.map((assertion) => JSON.stringify(assertion)).join(' ')}` : ''}`,
  );
  if (values.keep) console.log(`kept: ${dir}`);
  else rmSync(dir, { recursive: true, force: true });
}

// `--jobs` sessions run at once; after the first failure no session starts, and the run fails.
let next = 0;
let failure;
await Promise.all(
  Array.from({ length: Math.min(Number(values.jobs), pending.length) }, async () => {
    while (failure === undefined && next < pending.length) {
      const job = pending[next];
      next += 1;
      try {
        await runSession(job);
      } catch (error) {
        failure ??= error;
      }
    }
  }),
);
if (failure !== undefined) throw failure;

const date = new Date().toISOString().slice(0, 10);
const report = renderReport(date, config.model, summarize(results));
rmSync(journal, { force: true });
// Only a run of every case, binding, condition and run is a report of record.
if (values.case || values.binding || values.condition || values.runs) console.log(report);
else {
  const out = join(root, 'docs/evals');
  mkdirSync(out, { recursive: true });
  const file = join(out, `${date}-agent-docs.md`);
  writeFileSync(file, report);
  console.log(`report: ${relative(root, file)}`);
}
