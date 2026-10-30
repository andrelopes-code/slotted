import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

/**
 * The fragment as its regular expressions read it: the selector keys the
 * stylesheet matches are left out, and every tag stands on one line, as it did
 * before the formatter wrapped the tags the keys made long.
 */
function withoutSelectorKeys(markup) {
  return markup
    .replace(/\s+data-(?:part|ui)-[a-z0-9-]+=""/g, '')
    .replace(/<[^<>]+>/g, (tag) => tag.replace(/\s+/g, ' ').replace(/ (\/?>)$/, '$1'));
}

const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/accordion/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./accordion.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./accordion.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:>])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const member = contract.members.accordion;

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('is selected by the identifier the contract declares', () => {
  assert.ok(normalized.includes(`${ui}{`), 'the family has no base rule keyed on data-ui');
});

test('renders its one part, and the items it is a group of', () => {
  assert.deepEqual(member.parts, ['root']);
  assert.match(fragment, /data-ui="accordion" data-part="root"/);
  assert.match(fragment, new RegExp(`data-ui="${contract.itemFamily}"`));
});

/**
 * The rule `checkbox-group` set for every group family: a rule reaching the
 * item family's identifier from here would make one family's DOM part of
 * another's contract, so moving an item inside a wrapper would change its
 * appearance with no test to notice.
 */
test('selects nothing inside the family its items are', () => {
  assert.ok(
    !new RegExp(`\\[data-ui-${contract.itemFamily}\\]`).test(declarations),
    'the group reaches into the item family',
  );
  for (const part of ['trigger', 'panel', 'indicator', 'label']) {
    assert.ok(
      !normalized.includes(`[data-part-${part.toLowerCase()}]`),
      `the group styles the item's ${part} part`,
    );
  }
});

/** Each variant the group declares paints something, and each one is different. */
test('draws the chrome that belongs to the set, per variant', () => {
  for (const variant of contract.axes.variant) {
    if (variant === 'plain') continue;
    assert.ok(
      normalized.includes(`${ui}[data-variant='${variant}']{`),
      `${variant} paints nothing at the group's level`,
    );
  }
  assert.match(normalized, /\[data-variant='ruled'\]\{border-block-end:/);
  assert.match(normalized, /\[data-variant='framed'\]\{[^}]*border-radius:/);
  assert.match(normalized, /\[data-variant='separated'\]\{row-gap:/);
});

test('stacks its items in one column', () => {
  const root = normalized.split(`${ui}{`)[1]?.split('}')[0] ?? '';
  assert.match(root, /display:grid/);
  assert.match(root, /grid-auto-flow:row/);
  assert.ok(!/grid-auto-flow:column/.test(normalized), 'the set runs along the inline axis');
});

test('renders every declared state, and the pattern attribute requireOpen writes', () => {
  for (const attribute of Object.values(contract.stateAttributes)) {
    assert.match(fragment, new RegExp(attribute), `${attribute} appears in no scene`);
  }
  assert.match(fragment, /aria-disabled="true"/);
});

test('shows every variant the contract declares in a scene', () => {
  for (const variant of contract.axes.variant) {
    assert.match(
      fragment,
      new RegExp(`data-ui="accordion"[^>]*data-variant="${variant}"`),
      `${variant} appears in no scene`,
    );
  }
});
