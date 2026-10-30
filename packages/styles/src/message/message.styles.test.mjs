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
    new URL('../../../../specs/components/message/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./message.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./message.harness.html', import.meta.url), 'utf8'),
);
const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
/* A rule inside the family's `@scope` names its root `:scope`; the assertions name it by its
   identifier, which is the same element. */
const normalized = css
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')')
  .replace(/:scope\b/g, ui);

test('lives in the component layer and is selected by the identifier the contract declares', () => {
  assert.match(css, /@layer slotted\.components/);
  assert.ok(normalized.includes(`${ui}[data-part-root]{`), 'no rule for the row');
  assert.ok(normalized.includes(`${ui}[data-part-bubble]{`), 'no rule for the surface');
});

test('styles every part of both members, and renders each on the harness page', () => {
  for (const member of Object.values(contract.members)) {
    for (const part of member.parts) {
      if (part === 'root') continue;
      assert.ok(
        normalized.includes(`[data-part-${part.toLowerCase()}]`),
        `no rule reaches ${part}`,
      );
      assert.ok(fragment.includes(`data-part="${part}"`), `${part} is on no harness scene`);
    }
  }
  for (const attribute of Object.values(contract.stateAttributes)) {
    assert.ok(fragment.includes(attribute), `${attribute} is exercised on no harness scene`);
  }
  for (const [axis, values] of Object.entries(contract.axes)) {
    const attribute = axis === 'actionsVisibility' ? 'actions' : axis;
    for (const value of values) {
      assert.ok(
        fragment.includes(`data-${attribute}="${value}"`),
        `${axis} ${value} is on no scene`,
      );
    }
  }
});

/**
 * A bubble's height is a whole pixel at every density: the line is rounded up
 * to one, and the inset and edge are whole. ReUI's 1.625 line put its bubble
 * at 40.75 (dossier §3).
 */
test('rounds the words’ line up to a whole pixel', () => {
  assert.match(
    normalized,
    /--_leading:round\(up,calc\(var\(--_font-size\) ?\* ?var\(--slotted-line-height-md,1\.5\)\),1px\)/,
  );
});

/** The side is asked once, on the row; nothing in the sheet reads a side from the bubble. */
test('draws the side from the row and never from the bubble', () => {
  assert.doesNotMatch(normalized, /\[data-part-bubble\]\[data-align/);
  assert.ok(normalized.includes(`${ui}[data-part-root][data-align='end'] [data-part-bubble]`));
});

/**
 * A clamped text keeps its inset clean: the box clips at its content edge, so
 * the line after the last kept one does not paint into the padding.
 */
test('clips a clamped text at its content edge', () => {
  assert.match(normalized, /overflow:clip;overflow-clip-margin:content-box/);
});

/** A failure is said by the retry control and the word, never by a rim of a second colour. */
test('does not ring a failed message in the danger tone', () => {
  assert.doesNotMatch(normalized, /\[data-invalid\][^{]*\[data-part-content\]\{[^}]*danger-border/);
});

test('stops every loop under reduced motion', () => {
  const reduced = normalized.slice(normalized.indexOf('@media (prefers-reduced-motion:reduce)'));
  for (const part of ['caret', 'typing', 'activity-step']) {
    assert.ok(
      reduced.includes(`[data-part-${part.toLowerCase()}]`),
      `${part} keeps moving under reduced motion`,
    );
  }
});
