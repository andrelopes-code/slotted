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
    new URL('../../../../specs/components/column-manager/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./column-manager.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./column-manager.harness.html', import.meta.url), 'utf8'),
);
const normalized = css
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:>])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const member = contract.members.columnManager;
const item = `${ui}>[data-part-list]>[data-part-section]>[data-part-item]`;

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('is selected by the identifier the contract declares', () => {
  assert.ok(normalized.includes(`${ui}{`));
});

test('styles every part the contract declares', () => {
  for (const part of member.parts) {
    if (part === 'root') continue;
    assert.ok(normalized.includes(`[data-part-${part.toLowerCase()}]`), `no rule reaches ${part}`);
  }
});

test('renders every part the contract declares, in at least one scene', () => {
  for (const part of member.parts) {
    assert.match(fragment, new RegExp(`data-part="${part}"`), `${part} appears in no scene`);
  }
  for (const attribute of Object.values(contract.itemAttributes)) {
    assert.match(fragment, new RegExp(`data-part="item"[^>]*${attribute}`), attribute);
  }
  assert.match(fragment, /data-part="item"[^>]*data-dragging/);
  assert.match(fragment, /data-part="section"[^>]*data-drop-target/);
});

/**
 * The rows hold other families: the checkbox's `label` and `description`, the
 * buttons' `label`. Reached with a descendant combinator from the root, a
 * rule of this family's on `[data-part-label]` would restyle all of them,
 * so every part inside the list is reached step by step.
 */
test('reaches the row controls with child combinators', () => {
  for (const part of ['handle', 'visibility']) {
    assert.ok(normalized.includes(`${item}>[data-part-${part.toLowerCase()}]`), part);
  }
  assert.ok(normalized.includes(`${item}>:is([data-part-handle],[data-part-pin])`));
  assert.ok(!normalized.includes(`${ui} [data-part-label]`));
});

test('reads its two component tokens, each with the literal the contract records', () => {
  for (const [token, { value }] of Object.entries(contract.literals)) {
    assert.ok(normalized.includes(`var(${token},${value.replace(/,\s*/g, ',')})`), token);
  }
});

/** A pointer drop must not move a row while the reader aims. */
test('draws the drop line with no height of its own', () => {
  const rule = normalized.match(/\[data-part-section\]>\[data-part-drop-indicator\]\{([^}]*)\}/);
  assert.ok(rule, 'no rule for the drop indicator');
  assert.match(rule[1], /block-size:0/);
});

/**
 * The grip, the pin and the magnifier are `icon` elements the binding draws,
 * inked by the control's `color` in forced colours as everywhere else: no
 * mask, no pseudo-element and no `forced-color-adjust` stands in for them.
 */
test('holds hover back on a disabled handle and paints no glyph of its own', () => {
  assert.match(normalized, /:not\(\[data-disabled\]\):hover/);
  assert.match(
    normalized,
    /\[data-part-handle\]\[data-disabled\]\{[^}]*--slotted-disabled-foreground/,
  );
  assert.doesNotMatch(css, /mask-image|--slotted-icon-(?!size)/);
  assert.doesNotMatch(normalized, /\[data-part-(handle|pin)\][^{]*::after/);
});

test('answers its own width and regroups the footer below 20rem', () => {
  assert.match(normalized, /container-name:column-manager/);
  assert.match(normalized, /container-type:inline-size/);
  assert.match(css, /@container column-manager \(max-width: 20rem\)/);
});

test('styles the count on the trigger the family marks, not on any button', () => {
  assert.ok(normalized.includes('[data-column-manager-trigger] [data-part-count]{'));
  assert.ok(!normalized.includes('[data-ui-button] [data-part-count]'));
});
