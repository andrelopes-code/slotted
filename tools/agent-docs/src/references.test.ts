import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { loadCatalog, nameKind, unresolvedNames } from './references.ts';

const root = resolve(import.meta.dirname, '../../..');
const catalog = loadCatalog(root);
const rules = new Set(['AF-01']);

describe('nameKind', () => {
  it.each([
    ['data-grid', 'family'],
    ['body', 'part'],
    ['nav-header', 'part'],
    ['minDuration', 'option'],
    ['loadingDelay', 'option'],
    ['action', 'part'],
    ['data-loading', 'state'],
    ['bleed', 'axis-value'],
    ['--slotted-app-shell-row-inset', 'token'],
    ['--slotted-space-*', 'token-wildcard'],
    ['z-index', 'token-group'],
    ['easing', 'token-group'],
    ['aria-busy', 'aria'],
    ['AF-01', 'rule'],
    ['min-inline-size: 0', 'css-declaration'],
    ['MUST', 'guideline-format'],
    ['triggers', 'guideline-format'],
    ['Check', 'guideline-format'],
    ['Status: retired', 'guideline-format'],
    ['extendTheme', 'theme-api'],
    ['applyTheme', 'theme-api'],
    ['themeConformance', 'theme-api'],
    ['slotted-build-theme', 'theme-api'],
    ['@slotted/theme/seeds', 'theme-api'],
    ['@slotted/themes/default.css', 'theme-api'],
    ['data-slotted-seeds', 'theme-attribute'],
    ['--slotted-seed-accent', 'seed'],
    ['slotted', 'layer'],
    ['slotted.theme-rules', 'layer'],
    ['high-contrast', 'theme-axis-value'],
    ['system', 'theme-axis-value'],
    ['densities', 'theme-option'],
    ['reducedMotion', 'theme-option'],
    ['seeds', 'theme-option'],
    ['@slotted/react', 'package'],
    ['@slotted/angular', 'package'],
  ])('%s resolves as %s', (name, kind) => {
    expect(nameKind(name, catalog, rules)).toBe(kind);
  });

  it.each([
    'size="sm"',
    '/crm/customers/new',
    'customers.credit_view',
    'AF-99',
    '--slotted-nope-*',
    'ThemeDefinition',
    '--slotted-seed-brand',
    'slotted.overrides',
  ])('%s does not resolve', (name) => {
    expect(nameKind(name, catalog, rules)).toBeUndefined();
  });
});

describe('unresolvedNames', () => {
  // `css-declaration` takes a lowercase, hyphenated property: binding API in camelCase stays unresolved.
  it('returns each unresolved backticked name once, in order', () => {
    expect(
      unresolvedNames(
        'A `data-grid` with `rowHeader: true` and `rowHeader: true`, then `x.y`.',
        catalog,
        rules,
      ),
    ).toEqual(['rowHeader: true', 'x.y']);
  });

  it('resolves each token inside a CSS declaration', () => {
    expect(nameKind('gap: var(--slotted-nonexistent-9)', catalog, rules)).toBeUndefined();
    expect(
      nameKind(
        'inset-block-start: calc(var(--slotted-page-sticky-top, 0px) + 1rem)',
        catalog,
        rules,
      ),
    ).toBe('css-declaration');
  });

  it('accepts the local names the caller passes: docs paths and topic files', () => {
    const local = new Set(['{{docsDir}}/skeleton.md', 'list-pages.md']);
    expect(
      unresolvedNames(
        'Read `{{docsDir}}/skeleton.md`, then `list-pages.md`, not `{{docsDir}}/nope.md`.',
        catalog,
        rules,
        local,
      ),
    ).toEqual(['{{docsDir}}/nope.md']);
  });
});
