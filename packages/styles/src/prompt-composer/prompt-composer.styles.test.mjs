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
    new URL('../../../../specs/components/prompt-composer/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./prompt-composer.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./prompt-composer.harness.html', import.meta.url), 'utf8'),
);
const normalized = css
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:>])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const root = `${ui}[data-part-root]`;
const member = contract.members.promptComposer;

function rule(selector) {
  return normalized.split(`${selector}{`)[1]?.split('}')[0] ?? '';
}

test('lives in the component layer and is keyed on the identifier', () => {
  assert.match(css, /@layer slotted\.components/);
  assert.ok(normalized.includes(`${root}{`));
});

test('styles every part the contract declares, and renders each in a scene', () => {
  for (const part of member.parts) {
    assert.ok(normalized.includes(`[data-part-${part.toLowerCase()}]`), `no rule reaches ${part}`);
    assert.match(fragment, new RegExp(`data-part="${part}"`), `${part} is in no scene`);
  }
});

test('renders every state the contract declares in at least one scene', () => {
  for (const [state, attribute] of Object.entries(contract.stateAttributes)) {
    assert.match(fragment, new RegExp(attribute), `${state} is in no scene`);
  }
  for (const status of contract.axes.status) {
    assert.match(fragment, new RegExp(`data-status="${status}"`), `${status} is in no scene`);
  }
});

/**
 * The value grows from `rows` lines to `maxRows` with the platform's own
 * mechanism, the rule `textarea` set: no script measures a line.
 */
test('grows the value with field-sizing between a floor and a ceiling', () => {
  const input = rule(`${ui}>[data-part-input]`);
  assert.match(input, /field-sizing:content/);
  assert.match(input, /min-block-size:calc\(var\(--_rows\) \* 1lh/);
  assert.match(input, /max-block-size:calc\(var\(--_max-rows\) \* 1lh/);
  assert.match(input, /outline:none/, 'the frame draws the ring, so two rings never nest');
  assert.match(input, /unicode-bidi:plaintext/);
});

test('rings the frame for the value, and each button for itself', () => {
  assert.match(
    rule(`${root}:has(>[data-part-input]:focus-visible)`),
    /outline:var\(--slotted-focus-ring-width,2px\) solid/,
  );
  assert.match(
    rule(
      `${ui}>:is([data-part-header],[data-part-footer])>:is([data-part-action],[data-part-attach],[data-part-dictate]):focus-visible`,
    ),
    /outline-offset:calc\(var\(--slotted-focus-ring-offset,2px\) \* -1\)/,
  );
  assert.match(
    rule(`${ui}>[data-part-footer]>[data-part-submit]:focus-visible`),
    /outline-offset:var\(--slotted-focus-ring-offset,2px\)/,
  );
});

/**
 * The ring is drawn in its own color from the first frame, as every framed
 * control draws it. A transition on `outline-color` started from the resting
 * `currentColor` — the text's ink — and flashed white in a dark scheme.
 */
test('draws the frame ring without a transition from the text color', () => {
  const transition = rule(root).match(/transition:([^;]*)/)?.[1] ?? '';
  assert.doesNotMatch(transition, /outline/);
});

/**
 * The buttons in the bands sit concentric with the frame: the air around them
 * is the air a button has inside a control of this step, and their corner is
 * the frame's less that air.
 */
test('insets the bands by the air a button has inside a control', () => {
  const frame = rule(root);
  assert.match(
    frame,
    /--_inset:max\(0px,calc\(\(var\(--_height\) - 2 \* var\(--slotted-control-border-width,1px\) - var\(--_inner-size\)\) \/ 2\)\)/,
  );
  assert.match(
    frame,
    /--_action-radius:max\(var\(--slotted-radius-xs,2px\),calc\(var\(--_radius\) - var\(--_inset\)\)\)/,
  );
});

test('holds the send at the end of the footer without a spacer', () => {
  assert.match(rule(`${ui}>[data-part-footer]>[data-part-submit]`), /margin-inline-start:auto/);
});

test('paints no glyph itself', () => {
  assert.doesNotMatch(normalized, /mask-image/);
  assert.doesNotMatch(normalized, /content:'[^']+'/);
});

/**
 * A mark beside words is centerd on the band the letters occupy, not on the
 * line box, which keeps room for descenders and drops the mark below the
 * letters (docs/build-briefing.md, _A mark beside a line of text is aligned to
 * the text_). Measured in Chrome: the chevron's center and the letters' band
 * agree to 0.00 px.
 */
test('centers the mark of a worded button on the letters, not on the line box', () => {
  const flat = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
  assert.match(flat, /align-items: baseline;/);
  assert.match(
    flat,
    /margin-block-start: calc\(\(1cap \+ 1ex\) \/ 4 - var\(--_icon-size\) \/ 2\);/,
  );
  assert.match(flat, /translate: 0 calc\(var\(--_icon-size\) \/ 2 - \(1cap \+ 1ex\) \/ 4\);/);
});
