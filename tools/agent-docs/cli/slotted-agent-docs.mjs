#!/usr/bin/env node
/**
 * Keeps an application's agent material in step with the installed package.
 *
 *   slotted-agent-docs instructions write --file <path> [--app-root <dir>] [--theme <name>] [--theme-css <specifier>]
 *   slotted-agent-docs instructions check --file <path> [same flags]
 *   slotted-agent-docs skills link --dir <path> [--mode link|copy]
 *   slotted-agent-docs skills check --dir <path>
 *
 * `instructions` writes the package's `AGENTS.snippet.md` into a block of the
 * named file, between `<!-- slotted:begin version=… -->` and
 * `<!-- slotted:end -->`; text outside the markers is never touched. `skills`
 * makes `<dir>/<skill>` for each skill the package ships, as a relative link
 * or as a copy. Both `check` subcommands exit 1 when the file or the directory
 * differs from what the matching write would produce.
 *
 * The file and the directory are arguments: the command names no agent.
 */
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const BEGIN = /<!-- slotted:begin version=\S* -->/;
const END = '<!-- slotted:end -->';
const BASE_SENTENCE = 'Paths below are relative to the directory that holds node_modules.';

/** The package that ships this file: the nearest `package.json` named `@slotted/…` above it. */
function ownPackage() {
  let dir = dirname(realpathSync(fileURLToPath(import.meta.url)));
  for (;;) {
    const manifest = join(dir, 'package.json');
    if (existsSync(manifest)) {
      const { name, version } = JSON.parse(readFileSync(manifest, 'utf8'));
      if (typeof name === 'string' && name.startsWith('@slotted/')) {
        const docs = ['dist/docs', 'docs'].map((path) => join(dir, path)).find(existsSync);
        if (docs === undefined) fail(`${name} has no docs directory`);
        return { name, version, root: dir, docs };
      }
    }
    const parent = dirname(dir);
    if (parent === dir) fail('no @slotted package above this command');
    dir = parent;
  }
}

function fail(message) {
  process.stderr.write(`slotted-agent-docs: ${message}\n`);
  process.exit(2);
}

/* ── instructions ───────────────────────────────────────────────────────── */

function renderBlock(pkg, { appRoot, theme, themeCss }) {
  let snippet = readFileSync(join(pkg.docs, 'AGENTS.snippet.md'), 'utf8');
  if (appRoot !== undefined) {
    const prefix = appRoot.replaceAll('\\', '/').replace(/\/+$/, '') || '.';
    snippet = snippet
      .replace(BASE_SENTENCE, 'Paths below are relative to the directory of this file.')
      .replaceAll('`node_modules/', `\`${prefix}/node_modules/`);
  }
  if (theme !== undefined) {
    snippet = snippet.replaceAll('data-slotted-theme="default"', `data-slotted-theme="${theme}"`);
  }
  if (themeCss !== undefined) {
    snippet = snippet.replaceAll('`@slotted/themes/default.css`', `\`${themeCss}\``);
  }
  if (!snippet.endsWith('\n')) snippet += '\n';
  return `<!-- slotted:begin version=${pkg.version} -->\n${snippet}${END}`;
}

/** The file with the block in place: replaced where it stands, or appended. */
function withBlock(current, block) {
  const begin = BEGIN.exec(current);
  if (begin !== null) {
    const end = current.indexOf(END, begin.index);
    if (end === -1) fail('a begin marker without an end marker');
    return current.slice(0, begin.index) + block + current.slice(end + END.length);
  }
  if (current === '') return `${block}\n`;
  return `${current}${current.endsWith('\n') ? '' : '\n'}\n${block}\n`;
}

/** A unified diff of two texts, by lines, with three lines of context. */
function unifiedDiff(a, b, from, to) {
  const x = a.split('\n');
  const y = b.split('\n');
  const lcs = Array.from({ length: x.length + 1 }, () => new Array(y.length + 1).fill(0));
  for (let i = x.length - 1; i >= 0; i--)
    for (let j = y.length - 1; j >= 0; j--)
      lcs[i][j] = x[i] === y[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
  const ops = [];
  let i = 0;
  let j = 0;
  while (i < x.length || j < y.length) {
    if (i < x.length && j < y.length && x[i] === y[j]) ops.push([' ', x[i++], j++]);
    else if (j < y.length && (i === x.length || lcs[i][j + 1] >= lcs[i + 1][j]))
      ops.push(['+', y[j++], i]);
    else ops.push(['-', x[i++], j]);
  }
  const lines = [`--- ${from}`, `+++ ${to}`];
  let k = 0;
  while (k < ops.length) {
    if (ops[k][0] === ' ') {
      k++;
      continue;
    }
    let start = Math.max(0, k - 3);
    let stop = k;
    while (stop < ops.length) {
      let next = stop;
      while (next < ops.length && ops[next][0] === ' ') next++;
      if (next === ops.length || next - stop > 6) break;
      while (next < ops.length && ops[next][0] !== ' ') next++;
      stop = next;
    }
    stop = Math.min(ops.length, stop + 3);
    const hunk = ops.slice(start, stop);
    const oldStart = ops.slice(0, start).filter(([op]) => op !== '+').length + 1;
    const newStart = ops.slice(0, start).filter(([op]) => op !== '-').length + 1;
    const oldCount = hunk.filter(([op]) => op !== '+').length;
    const newCount = hunk.filter(([op]) => op !== '-').length;
    lines.push(`@@ -${oldStart},${oldCount} +${newStart},${newCount} @@`);
    for (const [op, text] of hunk) lines.push(`${op}${text}`);
    k = stop;
  }
  return `${lines.join('\n')}\n`;
}

function instructions(action, values) {
  if (values.file === undefined) fail('--file is required');
  const pkg = ownPackage();
  const block = renderBlock(pkg, {
    appRoot: values['app-root'],
    theme: values.theme,
    themeCss: values['theme-css'],
  });
  const current = existsSync(values.file) ? readFileSync(values.file, 'utf8') : '';
  const next = withBlock(current, block);
  if (action === 'write') {
    if (next !== current) {
      mkdirSync(dirname(resolve(values.file)), { recursive: true });
      writeFileSync(values.file, next);
    }
    return 0;
  }
  if (next === current) return 0;
  process.stdout.write(unifiedDiff(current, next, values.file, `${values.file} (expected)`));
  return 1;
}

/* ── skills ─────────────────────────────────────────────────────────────── */

/**
 * The skill directories as the application sees them: through its own
 * `node_modules/<package>`, whose path survives an upgrade, rather than the
 * store path a package manager may resolve this file to.
 */
function installedSkills(pkg) {
  const docsInPackage = relative(pkg.root, pkg.docs);
  let base = join(pkg.docs, 'skills');
  for (let dir = process.cwd(); ; dir = dirname(dir)) {
    const candidate = join(dir, 'node_modules', ...pkg.name.split('/'), docsInPackage, 'skills');
    if (existsSync(candidate)) {
      base = candidate;
      break;
    }
    if (dirname(dir) === dir) break;
  }
  const skills = new Map();
  if (!existsSync(base)) return skills;
  for (const entry of readdirSync(base, { withFileTypes: true })) {
    if (entry.isDirectory() && existsSync(join(base, entry.name, 'SKILL.md')))
      skills.set(entry.name, join(base, entry.name));
  }
  return skills;
}

/** A link this command wrote: one that names the package's skills directory. */
function isOwnLink(path, pkg) {
  return readlinkSync(path).split(/[\\/]/).join('/').includes(`${pkg.name}/`);
}

function sameTree(a, b) {
  const list = (dir) => readdirSync(dir, { recursive: true, encoding: 'utf8' }).sort();
  const left = list(a);
  const right = list(b);
  if (left.join('\n') !== right.join('\n')) return false;
  return left.every((file) => {
    const x = join(a, file);
    const y = join(b, file);
    if (statSync(x).isDirectory() || statSync(y).isDirectory())
      return statSync(x).isDirectory() === statSync(y).isDirectory();
    return readFileSync(x).equals(readFileSync(y));
  });
}

function skillsLink(written, mode, pkg) {
  const dir = resolve(written);
  const skills = installedSkills(pkg);
  if (skills.size === 0) fail(`${pkg.name} ships no skills`);
  mkdirSync(dir, { recursive: true });
  for (const [name, source] of skills) {
    const entry = join(dir, name);
    const target = relative(dir, source);
    const stat = existsSync(entry) || isLink(entry) ? lstatSync(entry) : null;
    if (stat !== null) {
      if (mode === 'link' && stat.isSymbolicLink() && readlinkSync(entry) === target) continue;
      if (mode === 'copy' && stat.isDirectory() && sameTree(entry, source)) continue;
      rmSync(entry, { recursive: true, force: true });
    }
    if (mode === 'link') symlinkSync(target, entry, 'dir');
    else cpSync(source, entry, { recursive: true });
  }
  /* A link to a skill the package no longer ships. */
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (!skills.has(entry) && isLink(path) && isOwnLink(path, pkg)) rmSync(path);
  }
  return 0;
}

function isLink(path) {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

function skillsCheck(dir, pkg) {
  const skills = installedSkills(pkg);
  const problems = [];
  for (const [name, source] of skills) {
    const entry = join(dir, name);
    if (isLink(entry)) {
      if (!existsSync(join(entry, 'SKILL.md'))) problems.push(`${entry}: dangling link`);
      else if (realpathSync(entry) !== realpathSync(source))
        problems.push(`${entry}: links to ${readlinkSync(entry)}, not the installed version`);
    } else if (!existsSync(entry)) problems.push(`${entry}: missing`);
    else if (!sameTree(entry, source))
      problems.push(`${entry}: differs from the installed version`);
  }
  if (existsSync(dir)) {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      if (!skills.has(entry) && isLink(path) && isOwnLink(path, pkg) && !existsSync(path))
        problems.push(`${path}: dangling link`);
    }
  }
  if (skills.size === 0) problems.push(`${pkg.name}: no installed skills`);
  for (const problem of problems) process.stdout.write(`${problem.split(sep).join('/')}\n`);
  return problems.length === 0 ? 0 : 1;
}

/* ── entry ──────────────────────────────────────────────────────────────── */

const [group, action, ...rest] = process.argv.slice(2);
const { values } = parseArgs({
  args: rest,
  options: {
    file: { type: 'string' },
    'app-root': { type: 'string' },
    theme: { type: 'string' },
    'theme-css': { type: 'string' },
    dir: { type: 'string' },
    mode: { type: 'string', default: 'link' },
  },
});

if (group === 'instructions' && (action === 'write' || action === 'check')) {
  process.exit(instructions(action, values));
} else if (group === 'skills' && (action === 'link' || action === 'check')) {
  if (values.dir === undefined) fail('--dir is required');
  if (values.mode !== 'link' && values.mode !== 'copy') fail('--mode is link or copy');
  const pkg = ownPackage();
  process.exit(
    action === 'link' ? skillsLink(values.dir, values.mode, pkg) : skillsCheck(values.dir, pkg),
  );
} else {
  fail(
    'usage: slotted-agent-docs instructions write|check --file <path> | skills link|check --dir <path>',
  );
}
