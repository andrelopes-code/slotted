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
    new URL('../../../../specs/components/message-scroller/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./message-scroller.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./message-scroller.harness.html', import.meta.url), 'utf8'),
);
const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
/* A rule inside the family's `@scope` names its root `:scope`; the assertions name it by its
   identifier, which is the same element. */
const normalized = css
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:])\s*/g, '$1')
  .replace(/:scope\b/g, ui);

test('lives in the component layer and is selected by the identifier the contract declares', () => {
  assert.match(css, /@layer slotted\.components/);
  assert.ok(normalized.includes(`${ui}[data-part-root]{`));
});

test('styles every part, and renders each on the harness page', () => {
  for (const part of contract.members.messageScroller.parts) {
    if (part === 'root') continue;
    assert.ok(normalized.includes(`[data-part-${part.toLowerCase()}]`), `no rule reaches ${part}`);
    assert.ok(fragment.includes(`data-part="${part}"`), `${part} is on no harness scene`);
  }
});

/** The engine keeps the reader's row; a native correction added to it would move the reader twice. */
test('turns native scroll anchoring off on the viewport', () => {
  assert.match(normalized, /\[data-part-viewport\]\{[^}]*overflow-anchor:none/);
});

test('reads the runtime state the engine writes, and hides the viewport until it opens', () => {
  for (const attribute of contract.runtimeAttributes) {
    if (attribute === 'data-following') continue;
    assert.ok(normalized.includes(attribute), `${attribute} is read by no rule`);
  }
  assert.ok(normalized.includes(`var(${contract.runtimeProperty},0px)`));
  assert.match(normalized, /\[data-part-viewport\]\[data-pending\]\{visibility:hidden/);
});

/** The row that holds a sticky separator sticks: a sticky box only sticks inside its containing block. */
test('sticks the row that holds a sticky separator', () => {
  assert.ok(normalized.includes('[data-part-item]:has(> [data-part-separator][data-sticky])'));
});

test('lets the jump control leave faster than it arrives', () => {
  assert.match(
    normalized,
    /\[data-part-jump\]\[data-active='false'\]\{[^}]*--slotted-duration-short[^}]*--slotted-easing-exit/,
  );
});
