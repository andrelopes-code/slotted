import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { availableParallelism } from 'node:os';

/**
 * Runs Prettier or ESLint on the files this branch changed, and on nothing
 * else: the files changed since the merge base with `origin/main` (the
 * commits not pushed yet), the uncommitted ones and the untracked ones. The
 * whole repository took 126 s to format-check and 116 s to lint; the changed
 * files take seconds. `--all` checks every file git knows, which is what
 * `pnpm check:full` does.
 *
 * One process, and a cache per scope: both tools drop from their cache every
 * file the run did not visit, so a run over the changed files — or one batch
 * of `xargs` — emptied the cache of the full run, and the full check stayed
 * cold at 144 s.
 *
 *   node scripts/check-changed.mjs format | lint [--all]
 */
const tool = process.argv[2];
const all = process.argv.includes('--all');
const scope = all ? 'all' : 'changed';
if (tool !== 'format' && tool !== 'lint') {
  console.error('usage: node scripts/check-changed.mjs format|lint');
  process.exit(2);
}

const git = (...args) => {
  const result = spawnSync('git', args, { encoding: 'utf8' });
  return result.status === 0 ? result.stdout : null;
};

const base = git('merge-base', 'HEAD', 'origin/main')?.trim() || 'HEAD';
const listed = (
  all
    ? [git('ls-files', '--cached', '--others', '--exclude-standard') ?? '']
    : [
        git('diff', '--name-only', '--diff-filter=ACMR', base) ?? '',
        git('diff', '--name-only', '--diff-filter=ACMR') ?? '',
        git('ls-files', '--others', '--exclude-standard') ?? '',
      ]
)
  .join('\n')
  .split('\n')
  .filter((file) => file !== '' && existsSync(file));
const files = [...new Set(listed)].filter(
  (file) => tool === 'format' || /\.(?:[cm]?js|tsx?)$/.test(file),
);

if (files.length === 0) {
  console.log(`${tool}: no changed files`);
  process.exit(0);
}

/**
 * The files are split across the processor's cores, each share in a process
 * of its own with a cache of its own. A file goes to the share its path
 * hashes to, so it meets the cache that holds it on every run.
 */
const shares = Math.max(1, Math.min(availableParallelism(), 8, Math.ceil(files.length / 200)));
const share = (file) => {
  let hash = 0;
  for (const char of file) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % shares;
};
const groups = Array.from({ length: shares }, (_, index) =>
  files.filter((file) => share(file) === index),
);

const command = (group, index) =>
  tool === 'format'
    ? [
        'prettier',
        '--check',
        '--cache',
        '--cache-strategy',
        'metadata',
        '--ignore-unknown',
        /* One configuration for the repository: named, it is not searched for
           again beside every file. */
        '--config',
        'prettier.config.js',
        '--no-editorconfig',
        '--cache-location',
        `node_modules/.cache/prettier/${scope}-${index}`,
        ...group,
      ]
    : [
        'eslint',
        '--max-warnings=0',
        '--no-warn-ignored',
        '--cache',
        '--cache-strategy',
        'metadata',
        '--cache-location',
        `node_modules/.cache/eslint/${scope}-${index}`,
        ...group,
      ];

const run = (group, index) =>
  new Promise((resolve) => {
    if (group.length === 0) return resolve(0);
    const child = spawn('pnpm', ['exec', ...command(group, index)], { stdio: 'inherit' });
    child.on('close', (code) => resolve(code ?? 1));
  });

const codes = await Promise.all(groups.map(run));
process.exit(codes.every((code) => code === 0) ? 0 : 1);
