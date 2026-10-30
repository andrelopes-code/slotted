import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { Topic } from './guidelines.ts';
import {
  registryAt,
  registryErrors,
  registryOf,
  rewriteErrors,
  type Registry,
} from './registry.ts';

const root = resolve(import.meta.dirname, '../../..');

function topic(rules: Topic['rules']): Topic {
  return {
    file: 'x.md',
    topic: 'x',
    prefix: 'AF',
    triggers: [],
    families: [],
    frontmatter: '',
    title: 'X',
    intro: '',
    rules,
  };
}
const active = (id: string, level: 'MUST' | 'SHOULD' = 'MUST') =>
  ({
    id,
    title: id,
    status: 'active',
    level,
    fields: [['Level', level]],
  }) as Topic['rules'][number];
const retired = (id: string, statusText: string) =>
  ({ id, title: id, status: 'retired', statusText, fields: [] }) as Topic['rules'][number];

describe('registryOf', () => {
  it('reads each rule: an active one with its level, a retired one with what replaced it', () => {
    expect(
      registryOf([
        topic([
          active('AF-01'),
          retired('AF-02', 'rewritten as AF-03, which keeps one scroller'),
          active('AF-03', 'SHOULD'),
          retired('AF-04', 'a domain rule'),
        ]),
      ]),
    ).toEqual({
      'AF-01': { status: 'active', level: 'MUST' },
      'AF-02': { status: 'retired', replacedBy: 'AF-03' },
      'AF-03': { status: 'active', level: 'SHOULD' },
      'AF-04': { status: 'retired' },
    });
  });
});

describe('registryErrors', () => {
  it('with no previous release, nothing to compare', () => {
    expect(registryErrors({}, undefined)).toEqual([]);
  });

  it('against the previous release: an id removed, a level changed, a retired id reused', () => {
    const previous: Registry = {
      'AF-01': { status: 'active', level: 'MUST' },
      'AF-02': { status: 'active', level: 'SHOULD' },
      'AF-03': { status: 'retired' },
    };
    const current: Registry = {
      'AF-01': { status: 'active', level: 'SHOULD' },
      'AF-03': { status: 'active', level: 'MUST' },
    };
    expect(registryErrors(current, previous)).toEqual([
      'AF-01: level changed from MUST to SHOULD; retire it and issue a new id',
      'AF-02: released before, gone from the topics',
      'AF-03: retired before, active again',
    ]);
  });
});

describe('registryAt', () => {
  it('reads the topics a commit has', () => {
    expect(registryAt(root, 'HEAD')?.['AF-01']?.status).toBe('active');
  });

  it('a commit without the guidelines, or no repository, has none', () => {
    expect(registryAt(root, 'v0.1.0-beta.0')).toBeUndefined();
    expect(registryAt('/nonexistent', 'HEAD')).toBeUndefined();
  });
});

describe('rewriteErrors', () => {
  it('reports a rewrite the release notes cannot read, and a replacement that is not an active rule', () => {
    expect(
      rewriteErrors([
        topic([
          retired('AF-01', 'Rewritten as AF-02'),
          active('AF-02'),
          retired('AF-03', 'rewritten as AF-09, which keeps one scroller'),
          retired('AF-04', 'rewritten as AF-02, which keeps one scroller'),
          retired('AF-05', 'a domain rule'),
        ]),
      ]),
    ).toEqual([
      'AF-01: the status names a rewrite; write it as "rewritten as XX-NN"',
      'AF-03: rewritten as AF-09, which is not an active rule',
    ]);
  });
});

describe('registryAt, a topic the parser refuses', () => {
  it('is an error, not a missing registry', () => {
    const repo = mkdtempSync(join(tmpdir(), 'registry-'));
    const dir = join(repo, 'tools/agent-docs/content/guidelines');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'broken.md'), '# No front matter\n');
    const git = (...args: string[]) => execFileSync('git', args, { cwd: repo, stdio: 'ignore' });
    git('init', '-q');
    git('add', '.');
    git(
      '-c',
      'user.name=test',
      '-c',
      'user.email=test@example.com',
      '-c',
      'commit.gpgsign=false',
      'commit',
      '-qm',
      'x',
    );
    expect(() => registryAt(repo, 'HEAD')).toThrow(/no frontmatter/);
  });
});
