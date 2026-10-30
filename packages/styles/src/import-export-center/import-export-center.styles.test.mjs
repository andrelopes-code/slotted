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
    new URL('../../../../specs/components/import-export-center/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./import-export-center.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./import-export-center.harness.html', import.meta.url), 'utf8'),
);
const normalized = css
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:>])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const member = contract.members.importExportCenter;

/** Every declaration of every rule whose selector list names the selector. */
function declarations(selector) {
  return normalized
    .split('}')
    .map((block) => block.split('{').slice(-2))
    .filter(([selectors]) => (selectors?.split(',') ?? []).includes(selector))
    .map(([, body]) => body)
    .join(';');
}

test('exercises every declared part in the fragment', () => {
  for (const part of member.parts) {
    assert.ok(fragment.includes(`data-part="${part}"`), `no scene renders ${part}`);
  }
});

/**
 * The status mark is centerd on the band `toast` measured for a mark beside a
 * line of text, `(1cap + 1ex) / 2` tall from the baseline: its center is half
 * the band above the baseline. The box sits on the baseline with its center at
 * `0.5em`, so it moves down by `0.5em` less a quarter of `1cap + 1ex`, rounded
 * to a whole pixel.
 *
 * The first version divided by two instead of four — the center on the band's
 * top — and the mark stood four pixels above the words on every status line,
 * which a reviewer saw at once and no test caught. Measured in Chrome with
 * Geist at 13px after the fix: the mark's center 4.50px above the baseline
 * against a band midpoint of 4.15px, the whole-pixel snap.
 */
test('centers the status mark on the middle of the cap and x-height band', () => {
  const mark = declarations(`${ui} [data-part-status]>[data-part-mark]`);
  assert.match(mark, /--slotted-icon-size:1em/);
  assert.match(mark, /align-self:baseline/);
  assert.match(
    mark,
    /inset-block-start:round\(nearest,calc\(0\.5em - \(1cap \+ 1ex\) \/ 4\),1px\)/,
  );
});

/**
 * A separator dot is centerd on the middle of the x-height, measured from the
 * baseline with `vertical-align`, not from the line box: anchored to the line
 * box it sat 1.4 pixels below the lowercase letters. Its two inline margins add
 * up to minus its own width, so the words beside it do not move.
 */
test('centers the separator dot on the middle of the x-height, and moves no word', () => {
  const dot = declarations(`${ui} [data-part-meta]>* + *::before`);
  assert.match(dot, /display:inline-block/);
  assert.match(dot, /vertical-align:calc\(0\.5ex - var\(--_separator\) \/ 2\)/);
  assert.match(
    dot,
    /margin-inline-start:calc\(\(var\(--_separator-gap\) \+ var\(--_separator\)\) \/ -2\)/,
  );
  assert.match(
    dot,
    /margin-inline-end:calc\(\(var\(--_separator-gap\) - var\(--_separator\)\) \/ 2\)/,
  );
});

/**
 * A running job draws `spinner`, not a glyph set turning: the family holds no
 * animation of its own, and the ring freezes itself under reduced motion.
 */
test('draws the running mark with spinner and animates nothing of its own', () => {
  assert.doesNotMatch(normalized, /@keyframes/);
  assert.doesNotMatch(normalized, /animation:/);
  assert.doesNotMatch(fragment, /data-glyph="loader-circle"/);
  assert.match(fragment, /data-part="mark" aria-hidden="true"\s*><span data-ui="spinner">/);
  assert.match(
    declarations(`${ui} [data-part-status]>[data-part-mark]`),
    /--slotted-spinner-size:1em/,
  );
});

/**
 * The mark and the words never part: the mark has a column of its own and the
 * words wrap inside the column beside it.
 */
test('keeps the mark beside its words at every width', () => {
  const status = declarations(`${ui} [data-part-body]>[data-part-status]`);
  assert.match(status, /display:grid/);
  assert.match(status, /grid-template-columns:auto minmax\(0,1fr\)/);
  assert.match(status, /column-gap:var\(--_mark-gap\)/);
  assert.match(normalized, /--_mark-gap:var\(--slotted-space-3,0\.375rem\)/);
});

/**
 * The stage is one line that ends in an ellipsis, and an item of a secondary
 * line wraps whole or truncates. Each clips with a margin the width of the
 * gap, so the separator it hangs there is still painted.
 */
test('truncates the stage and the items of a secondary line instead of splitting them', () => {
  for (const selector of [
    `${ui} [data-part-status-label]>[data-part-stage]`,
    `${ui} [data-part-meta]>*`,
  ]) {
    const rules = declarations(selector);
    assert.match(rules, /white-space:nowrap/, selector);
    assert.match(rules, /text-overflow:ellipsis/, selector);
    assert.match(rules, /overflow:clip/, selector);
    assert.match(rules, /overflow-clip-margin:var\(--_separator-gap\)/, selector);
  }
});

/** The Disclosure toggle keeps its words; aria-expanded says which state it is in. */
test('keeps the toggle words the same while the details are shown', () => {
  const labels = [
    ...fragment.matchAll(/aria-expanded="(true|false)"[\s\S]*?data-part="label">([^<]+)</g),
  ];
  assert.ok(labels.length > 0);
  for (const [, , label] of labels) assert.equal(label, 'Detalhes');
});
