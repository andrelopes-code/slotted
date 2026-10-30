import assert from 'node:assert/strict';
import test from 'node:test';

import { extractSource, NOT_RUNTIME } from './extract-i18n.mjs';
import {
  catalogViolations,
  concatenations,
  contractViolations,
  textViolations,
} from './verify-i18n.mjs';

const texts = (source, file = 'family.tsx') =>
  extractSource(source, file, 'react', 'family').entries.map((entry) => entry.text);

test('finds a text constant, a catalog and a text default', () => {
  assert.deepEqual(texts("export const FAMILY_CLOSE_LABEL = 'Close';"), ['Close']);
  assert.deepEqual(texts("export const FAMILY_LABELS = { close: 'Close', open: 'Open' };"), [
    'Close',
    'Open',
  ]);
  assert.deepEqual(
    texts("export const FAMILY_FALLBACK = { size: 'md', clearLabel: 'Clear all' };"),
    ['Clear all'],
  );
});

test('finds words written straight into markup', () => {
  assert.deepEqual(texts('const a = <button aria-label="Close dialog" />;'), ['Close dialog']);
  assert.deepEqual(texts('const a = <p>No results found</p>;'), ['No results found']);
  assert.deepEqual(texts("const a = { 'aria-label': 'Full screen' };"), ['Full screen']);
  assert.deepEqual(
    texts(
      '@Component({ template: `<button aria-label="Close"></button>` }) class A {}',
      'family.ts',
    ),
    ['Close'],
  );
});

test('finds an Angular input whose default is words', () => {
  assert.deepEqual(texts("class A { readonly clearLabel = input('Clear all'); }", 'family.ts'), [
    'Clear all',
  ]);
});

test('leaves errors, technical attributes and modes alone', () => {
  assert.deepEqual(texts("throw new Error('Pagination parts must be inside a Pagination.');"), []);
  assert.deepEqual(texts('const a = <div data-state="open" role="dialog" />;'), []);
  assert.deepEqual(texts("export const FAMILY_FALLBACK = { valueLabel: 'auto', size: 'md' };"), []);
  assert.deepEqual(texts("const a = <span aria-label={t('close')} />;"), []);
  /* `aria-keyshortcuts` names keys by their UI Events value, a token and not a word. */
  assert.deepEqual(
    texts("const ARIA_MODIFIERS = { alt: 'Alt', ctrl: 'Control', meta: 'Meta', shift: 'Shift' };"),
    [],
  );
  assert.deepEqual(texts("const props = { alt: 'Team photo' };"), ['Team photo']);
});

test('does not read demos, stories, tests or docs as runtime', () => {
  for (const path of [
    'pagination/pagination-demo.tsx',
    'pagination/src/pagination.demo.ts',
    'pagination/pagination.stories.tsx',
    'pagination/pagination.test.tsx',
    'pagination/src/pagination.spec.ts',
    'pagination/pagination.docs.ts',
  ]) {
    assert.ok(NOT_RUNTIME.test(path), path);
  }
  assert.ok(!NOT_RUNTIME.test('pagination/pagination-parts.tsx'));
});

test('reports every text the inventory found in a binding or in core', () => {
  const inventory = {
    families: {
      dialog: {
        react: { '@aria-label#Close': { text: 'Close', at: 'a.tsx:1' } },
        angular: {},
        core: {},
      },
      table: { react: {}, angular: {}, core: {} },
    },
  };
  assert.deepEqual(textViolations(inventory), ['dialog (react): "Close" at a.tsx:1']);
});

test('holds every locale to the keys, the slots and the grammar of en-US', () => {
  const en = { table: { rows: '{count, plural, one {# row} other {# rows}}', title: 'Rows' } };
  // language: pt-BR
  const good = {
    table: { rows: '{count, plural, one {# linha} other {# linhas}}', title: 'Linhas' },
  };
  // language: en-US
  assert.deepEqual(catalogViolations(en, { 'pt-BR': good }), []);

  // language: pt-BR
  const missing = { table: { rows: '{count, plural, one {# linha} other {# linhas}}' } };
  // language: en-US
  assert.deepEqual(catalogViolations(en, { 'pt-BR': missing }), ['pt-BR: missing table.title']);

  // language: pt-BR
  const lostSlot = { table: { rows: '# linhas', title: 'Linhas' } };
  // language: en-US
  assert.deepEqual(catalogViolations(en, { 'pt-BR': lostSlot }), [
    'pt-BR: table.rows reads [] where en-US reads [count]',
  ]);

  // language: pt-BR
  const broken = { table: { rows: '{count, plural, one {# linha}', title: 'Linhas' } };
  // language: en-US
  assert.deepEqual(catalogViolations(en, { 'pt-BR': broken }), [
    'pt-BR: table.rows reads [] where en-US reads [count]',
    'pt-BR: table.rows is not well formed',
  ]);
});

test('holds a contract to the keys of its family in en-US', () => {
  const en = { dataGrid: { rows: 'Rows', filterOperators: { contains: 'Contains' } } };
  assert.deepEqual(
    contractViolations(en, { 'data-grid': { messages: ['rows', 'filterOperators.contains'] } }),
    [],
  );
  assert.deepEqual(contractViolations(en, { 'data-grid': { messages: ['rows'] } }), [
    'data-grid: contract messages [rows] differ from en-US [rows, filterOperators.contains]',
  ]);
  assert.deepEqual(contractViolations(en, { 'data-grid': { labels: { rows: 'Rows' } } }), [
    'data-grid: contract still declares labels',
  ]);
});

test('finds a sentence built around a message, which fixes English word order', () => {
  assert.deepEqual(concatenations("const a = `${t('filter')} ${name}`;", 'a.tsx'), [
    "a.tsx:1: `${t('filter')} ${name}`",
  ]);
  assert.deepEqual(
    concatenations("const a = grid.t('columnMenu') + ', ' + name;", 'a.tsx').length,
    1,
  );
  assert.deepEqual(
    concatenations(
      "@Component({ template: `<b [attr.aria-label]=\"t('filter') + ' ' + label\"></b>` }) class A {}",
      'a.ts',
    ).length,
    1,
  );
});

test('leaves a message passed whole, or joined to punctuation-free markup, alone', () => {
  assert.deepEqual(concatenations("const a = t('filterColumn', { column: name });", 'a.tsx'), []);
  assert.deepEqual(concatenations("const a = `${t('a')}`;", 'a.tsx'), []);
  assert.deepEqual(concatenations("const a = [t('a'), t('b')].join(' ');", 'a.tsx').length, 1);
});

test('finds words in a template literal a reader meets in markup', () => {
  assert.deepEqual(texts('const a = <button aria-label={`Remove ${name}`} />;'), [
    'Remove ${name}',
  ]);
  assert.deepEqual(texts('const a = <p>{`${count} rows selected`}</p>;'), [
    '${count} rows selected',
  ]);
  assert.deepEqual(texts("const a = <p aria-label={`${t('x')}`} />;"), []);
});

test('finds words around Angular interpolation and control flow, and in bound attributes', () => {
  const angular = (template) =>
    texts(`@Component({ template: \`${template}\` }) class A {}`, 'a.ts');
  assert.deepEqual(angular('@if (empty()) { No results found }'), ['No results found']);
  assert.deepEqual(angular('<p>Showing {{ count() }} rows</p>'), ['Showing {{ count() }} rows']);
  assert.deepEqual(angular('<b [attr.aria-label]="\'Close dialog\'"></b>'), ['Close dialog']);
  assert.deepEqual(angular('<b aria-label="Remove {{ name }}"></b>'), ['Remove {{ name }}']);
  assert.deepEqual(angular("<p>{{ t('empty') }}</p>"), []);
  assert.deepEqual(angular("@if (a) { {{ t('empty') }} }"), []);
});

test('finds a sentence built around a message in markup', () => {
  assert.equal(concatenations("const a = <p>{t('filter')}: {name}</p>;", 'a.tsx').length, 1);
  assert.equal(concatenations('const a = t("filter") + name;', 'a.tsx').length, 1);
  assert.equal(
    concatenations(
      "@Component({ template: `<p>{{ t('filter') }}: {{ name }}</p>` }) class A {}",
      'a.ts',
    ).length,
    1,
  );
  assert.equal(concatenations("const a = <p>{t('filter')}</p>;", 'a.tsx').length, 0);
});

test('reads no text inside a tag, its bindings or its expressions', () => {
  const angular = (template) =>
    texts(`@Component({ template: \`${template}\` }) class A {}`, 'a.ts');
  assert.deepEqual(
    angular(
      '<ng-container *ngTemplateOutlet="row; context: { $implicit: entry, current: isCurrent(entry) }" />',
    ),
    [],
  );
  assert.deepEqual(angular('<b [hidden]="items().length > 0" (click)="go($event, item)"></b>'), []);
  assert.deepEqual(angular('@for (item of items(); track item.id) { <i>{{ item.name }}</i> }'), []);
});

test('reads a template kept in a module constant', () => {
  const source = 'const BODY = `<b>Close dialog</b>`;\n@Component({ template: BODY }) class A {}';
  assert.deepEqual(texts(source, 'a.ts'), ['Close dialog']);
  assert.deepEqual(texts('@Component({ template: IMPORTED }) class A {}', 'a.ts'), []);
});

test('reads markup spliced into a template as markup, not as words', () => {
  assert.deepEqual(
    texts('@Component({ template: `<span>${TAG_BODY_TEMPLATE}</span>` }) class A {}', 'a.ts'),
    [],
  );
});
