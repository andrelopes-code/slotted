import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { parseSkill, renderContent, skillErrors, THEME_SCOPE } from './skills.ts';

const root = resolve(import.meta.dirname, '../../..');

const source = `---
name: waiting-states
description: Use when a screen waits for data.
---

# Waiting states

Read \`{{docsDir}}/skeleton.md\` from \`{{package}}\`. AF-01 applies.
`;

describe('skills', () => {
  it('parses the frontmatter', () => {
    expect(parseSkill(source)).toMatchObject({
      name: 'waiting-states',
      description: 'Use when a screen waits for data.',
    });
  });

  it('accepts a skill whose name matches its directory and whose ids are active', () => {
    expect(skillErrors('waiting-states', parseSkill(source), new Set(['AF-01']))).toEqual([]);
  });

  it('reports a name unlike the directory, a description not starting "Use when", an inactive id', () => {
    const broken = source.replace('Use when a screen', 'Shows a screen');
    expect(skillErrors('other', parseSkill(broken), new Set())).toEqual([
      'other: name is waiting-states',
      'other: description does not start with "Use when"',
      'other: cites AF-01, which is not an active rule',
    ]);
  });

  it('substitutes the docs directory relative to the file, and the package per binding', () => {
    expect(renderContent(source, 'angular', '../..')).toContain(
      'Read `../../skeleton.md` from `@slotted/angular`.',
    );
    expect(renderContent(source, 'react', '..')).toContain('`../skeleton.md`');
  });

  it('substitutes the theme scope of each binding, and accepts the placeholder', () => {
    const scoped = source.replace('AF-01 applies.', 'Set the scheme on {{themeScope}}.');
    expect(skillErrors('waiting-states', parseSkill(scoped), new Set())).toEqual([]);
    expect(renderContent(scoped, 'react', '../..')).toContain(
      `Set the scheme on ${THEME_SCOPE.react}.`,
    );
    expect(renderContent(scoped, 'angular', '../..')).toContain(
      `Set the scheme on ${THEME_SCOPE.angular}.`,
    );
  });

  it('names a theme scope each binding exports', () => {
    const react = readFileSync(join(root, 'packages/react/src/theme/index.ts'), 'utf8');
    expect(THEME_SCOPE.react).toBe('the `ThemeScope` component from `@slotted/react/theme`');
    expect(react).toMatch(/export \{ ThemeScope \}/);
    const angular = readFileSync(join(root, 'packages/angular/theme/src/theme-scope.ts'), 'utf8');
    expect(THEME_SCOPE.angular).toBe('the `slThemeScope` directive from `@slotted/angular/theme`');
    expect(angular).toContain("selector: '[slThemeScope]'");
  });
});
