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
    new URL('../../../../specs/components/checkbox-group/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./checkbox-group.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./checkbox-group.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:>])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const root = `${ui}[data-part-root]`;
const member = contract.members.checkboxGroup;

function rule(selector) {
  return normalized.split(`${selector}{`)[1]?.split('}')[0] ?? '';
}

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('is selected by the identifier the contract declares', () => {
  assert.ok(normalized.includes(`${root}{`), 'the family has no base rule keyed on data-ui');
});

test('styles every part the contract declares', () => {
  assert.deepEqual(member.parts, ['root']);
});

test('renders its one part, and the family it arranges, in at least one scene', () => {
  assert.match(fragment, /data-ui="checkbox-group" data-part="root"/);
  assert.match(fragment, new RegExp(`data-ui="${contract.itemFamily}"`));
});

/**
 * The group arranges and the boxes draw themselves. A rule reaching
 * `[data-ui-checkbox]` from here would make one family's DOM part of
 * another's contract, so moving a box inside a wrapper would change its
 * appearance with no test to notice — the descendant-selector defect the
 * field-aware controls design records for exactly this reason.
 */
test('never selects into the family it arranges', () => {
  assert.doesNotMatch(declarations, /\[data-ui-checkbox\]/);
});

test('wraps a horizontal group rather than clipping or scrolling it', () => {
  const horizontal = rule(`${root}[data-orientation='horizontal']`);
  assert.match(horizontal, /flex-wrap:wrap/);
  assert.match(horizontal, /column-gap:calc\(var\(--_gap\) \* 2\)/);
});

/**
 * The only thing a size means here is the distance between two choices: the
 * group holds no type of its own, and the boxes take their step from the value
 * the binding hands them rather than from a descendant selector.
 */
test('carries the step as a gap and nothing else', () => {
  for (const size of contract.axes.size) {
    const block = rule(`${root}[data-size='${size}']`);
    assert.match(block, /--_gap:var\(--slotted-control-gap-/, `no gap answers ${size}`);
    assert.doesNotMatch(block, /font-size|block-size|inline-size/);
  }
});

test('states its gap in one custom property the theme restates per density', () => {
  assert.match(rule(root), /gap:var\(--slotted-checkbox-group-gap,var\(--_gap\)\)/);
});

test('writes every rule in logical properties and states no duration', () => {
  assert.doesNotMatch(declarations, /margin-left|margin-right|padding-left|padding-right/);
  assert.doesNotMatch(declarations, /\d+m?s(?![\w-])/);
});

/**
 * A choice with a description is two rows tall. At one control gap the second
 * row sat as near the next label as its own, so proximity named the wrong
 * owner. The distance doubles exactly where the second row exists, and the
 * public override still wins.
 */
test('separates two described choices by twice the distance it separates bare ones', () => {
  const described = rule(`${root}:has([data-part-description])`);
  assert.match(described, /row-gap:var\(--slotted-checkbox-group-gap,calc\(var\(--_gap\) \* 2\)\)/);
  assert.match(rule(root), /gap:var\(--slotted-checkbox-group-gap,var\(--_gap\)\)/);
});
