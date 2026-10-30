import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { renderAgentsSnippet } from './render.ts';

const cli = resolve(import.meta.dirname, '../cli/slotted-agent-docs.mjs');
const VERSION = '0.1.0-beta.9';

/** An application with `@slotted/react` installed as the package publishes it. */
function app() {
  const root = mkdtempSync(join(tmpdir(), 'app-'));
  const pkg = join(root, 'node_modules/@slotted/react');
  mkdirSync(join(pkg, 'dist/bin'), { recursive: true });
  writeFileSync(
    join(pkg, 'package.json'),
    JSON.stringify({ name: '@slotted/react', version: VERSION }),
  );
  copyFileSync(cli, join(pkg, 'dist/bin/slotted-agent-docs.mjs'));
  const docs = join(pkg, 'dist/docs');
  for (const [name, files] of [
    ['compose-screen', { 'SKILL.md': '---\nname: compose-screen\n---\nRead `../../index.md`.\n' }],
    ['theme-app', { 'SKILL.md': '---\nname: theme-app\n---\n', 'notes/seeds.md': 'Seeds.\n' }],
  ] as const) {
    for (const [file, text] of Object.entries(files)) {
      mkdirSync(join(docs, 'skills', name, file, '..'), { recursive: true });
      writeFileSync(join(docs, 'skills', name, file), text);
    }
  }
  writeFileSync(join(docs, 'AGENTS.snippet.md'), renderAgentsSnippet('react'));
  writeFileSync(join(docs, 'index.md'), '# Index\n');
  const run = (...args: string[]) =>
    spawnSync(process.execPath, [join(pkg, 'dist/bin/slotted-agent-docs.mjs'), ...args], {
      cwd: root,
      encoding: 'utf8',
    });
  return { root, pkg, docs, run };
}

describe('slotted-agent-docs instructions', () => {
  it('writes the snippet between the markers, prefixed, and leaves the text outside them as it was', () => {
    const { root, run } = app();
    const file = join(root, 'web/AGENTS.md');
    const before = '# Web\n\nOur own rules.\n';
    mkdirSync(join(root, 'web'));
    writeFileSync(file, before);

    expect(run('instructions', 'write', '--file', file, '--app-root', '..').status).toBe(0);
    const after = '\n## After\n\nMore of our own rules.\n';
    writeFileSync(file, readFileSync(file, 'utf8') + after);
    expect(
      run(
        'instructions',
        'write',
        '--file',
        file,
        '--app-root',
        '..',
        '--theme',
        'brand',
        '--theme-css',
        '@acme/brand/theme.css',
      ).status,
    ).toBe(0);

    const text = readFileSync(file, 'utf8');
    const begin = text.indexOf('<!-- slotted:begin');
    const end = text.indexOf('<!-- slotted:end -->') + '<!-- slotted:end -->'.length;
    expect(text.slice(0, begin)).toBe(`${before}\n`);
    expect(text.slice(end)).toBe(`\n${after}`);

    const snippet = renderAgentsSnippet('react')
      .replace(
        'Paths below are relative to the directory that holds node_modules.',
        'Paths below are relative to the directory of this file.',
      )
      .replaceAll('`node_modules/', '`../node_modules/')
      .replaceAll('data-slotted-theme="default"', 'data-slotted-theme="brand"')
      .replaceAll('`@slotted/themes/default.css`', '`@acme/brand/theme.css`');
    expect(text.slice(begin, end)).toBe(
      `<!-- slotted:begin version=${VERSION} -->\n${snippet}<!-- slotted:end -->`,
    );
    expect(text).toContain('`../node_modules/@slotted/react/dist/docs/index.md`');
  });

  it('checks the block, and prints a diff and exits 1 when it was edited', () => {
    const { root, run } = app();
    const file = join(root, 'AGENTS.md');

    expect(run('instructions', 'check', '--file', file).status).toBe(1);
    run('instructions', 'write', '--file', file);
    expect(run('instructions', 'check', '--file', file).status).toBe(0);

    writeFileSync(file, readFileSync(file, 'utf8').replace('Before writing', 'Before typing'));
    const result = run('instructions', 'check', '--file', file);
    expect(result.status).toBe(1);
    expect(result.stdout).toMatch(/^--- .*AGENTS\.md\n\+\+\+ /);
    expect(result.stdout).toContain('-Before typing');
    expect(result.stdout).toContain('+Before writing');
  });
});

describe('slotted-agent-docs skills', () => {
  it('links one resolvable SKILL.md per skill, relatively, and check fails once the package is gone', () => {
    const { root, docs, run } = app();
    const dir = join(root, '.agent/skills');

    expect(run('skills', 'link', '--dir', dir).status).toBe(0);
    for (const name of ['compose-screen', 'theme-app']) {
      expect(lstatSync(join(dir, name)).isSymbolicLink()).toBe(true);
      expect(isAbsolute(readlinkSync(join(dir, name)))).toBe(false);
      expect(readFileSync(join(dir, name, 'SKILL.md'), 'utf8')).toBe(
        readFileSync(join(docs, 'skills', name, 'SKILL.md'), 'utf8'),
      );
    }
    expect(run('skills', 'check', '--dir', dir).status).toBe(0);
    expect(run('skills', 'link', '--dir', dir).status).toBe(0);

    rmSync(join(docs, 'skills'), { recursive: true });
    const result = run('skills', 'check', '--dir', dir);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('dangling link');
  });

  it('copies each skill in copy mode, replaces a stale copy, and check fails on a copy that differs', () => {
    const { root, docs, run } = app();
    const dir = join(root, '.agent/skills');

    expect(run('skills', 'link', '--dir', dir, '--mode', 'copy').status).toBe(0);
    for (const name of ['compose-screen', 'theme-app']) {
      expect(lstatSync(join(dir, name)).isDirectory()).toBe(true);
      expect(readFileSync(join(dir, name, 'SKILL.md'), 'utf8')).toBe(
        readFileSync(join(docs, 'skills', name, 'SKILL.md'), 'utf8'),
      );
    }
    expect(readFileSync(join(dir, 'theme-app/notes/seeds.md'), 'utf8')).toBe('Seeds.\n');
    expect(run('skills', 'check', '--dir', dir).status).toBe(0);

    writeFileSync(join(docs, 'skills/theme-app/SKILL.md'), '---\nname: theme-app\n---\nNew.\n');
    const result = run('skills', 'check', '--dir', dir);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('theme-app: differs from the installed version');

    expect(run('skills', 'link', '--dir', dir, '--mode', 'copy').status).toBe(0);
    expect(readFileSync(join(dir, 'theme-app/SKILL.md'), 'utf8')).toContain('New.');
    expect(run('skills', 'check', '--dir', dir).status).toBe(0);
  });

  it('replaces a copy with a link when the mode changes', () => {
    const { root, run } = app();
    const dir = join(root, '.agent/skills');

    run('skills', 'link', '--dir', dir, '--mode', 'copy');
    expect(run('skills', 'link', '--dir', dir).status).toBe(0);

    expect(lstatSync(join(dir, 'compose-screen')).isSymbolicLink()).toBe(true);
    expect(run('skills', 'check', '--dir', dir).status).toBe(0);
  });
});
