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
    new URL('../../../../specs/components/textarea/contract.json', import.meta.url),
    'utf8',
  ),
);
const textField = readFileSync(new URL('../text-field/text-field.css', import.meta.url), 'utf8');
const css = readFileSync(new URL('./textarea.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./textarea.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:>])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const root = `${ui}[data-part-root]`;
const member = contract.members.textarea;

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
  assert.ok(normalized.includes(`[data-part-root]`));
});

/**
 * The two controls share a foundation and not a stylesheet. Reaching into
 * `text-field`'s selectors would make one family's DOM part of the other's
 * contract, and a theme could then no longer move one without the other.
 */
test('shares the foundation with the single-line control and not its selectors', () => {
  assert.doesNotMatch(declarations, /data-ui='text-field'/);
  for (const token of ['--slotted-control-height-md', '--slotted-control-border-color']) {
    assert.ok(declarations.includes(token) && textField.includes(token));
  }
});

/**
 * The block padding is derived rather than chosen: half of what is left when
 * one line box is taken out of the control height. A textarea of one row is
 * then exactly as tall as an input of the same step, at every density, and no
 * second scale is invented for it.
 */
test('derives its block padding from the control height and its own line box', () => {
  assert.match(
    rule(root),
    /--_padding-block:max\(0px,calc\(\(var\(--_height\)\s*-\s*1lh\)\s*\/\s*2\)\)/,
  );
  assert.match(rule(root), /padding-block:var\(--_padding-block\)/);
  assert.doesNotMatch(declarations, /padding-block:\s*\d+px/);
});

test('takes every step from the control scales rather than stating one', () => {
  for (const size of contract.axes.size) {
    const step = rule(`${root}[data-size='${size}']`);
    assert.match(step, new RegExp(`--_height:var\\(--slotted-control-height-${size}`));
    assert.match(step, new RegExp(`--_font-size:var\\(--slotted-control-font-size-${size}`));
  }
  assert.doesNotMatch(declarations, /block-size:\s*\d+px/, 'a step is stated in pixels');
});

/**
 * The floor is the number of rows, restated in the stylesheet because
 * `field-sizing: content` stops the HTML attribute from being one; the ceiling
 * is what keeps a growing control from pushing the page out from under the
 * caret.
 */
test('states the floor and the ceiling in line boxes', () => {
  assert.match(rule(root), /--_rows:var\(--slotted-textarea-rows,3\)/);
  assert.match(rule(root), /--_max-rows:var\(--slotted-textarea-max-rows,12\)/);
  /* One padding, not two: the bottom padding of a scrolling box belongs to the
     end of its scroll range rather than to the bottom of what is on screen. */
  assert.match(
    rule(root),
    /--_scroll-frame:calc\(var\(--_padding-block\)\s*\+\s*var\(--slotted-control-border-width,1px\)\s*\*\s*2\)/,
  );
  assert.match(
    rule(`${root}[data-auto-size]`),
    /min-block-size:calc\(var\(--_rows\)\s*\*\s*1lh\s*\+\s*var\(--_frame\)\)/,
  );
  /* And nowhere else: while the control does not size itself, `rows` is the
     height and a second source of truth beside it can only disagree. */
  assert.doesNotMatch(rule(root), /min-block-size/);
  assert.match(
    rule(`${root}[data-auto-size]`),
    /max-block-size:calc\(var\(--_max-rows\)\s*\*\s*1lh\s*\+\s*var\(--_scroll-frame\)\)/,
  );
});

/**
 * The platform grows the control. Nothing is measured on the main thread, no
 * line height is cached and no layout is read per keystroke, which is what
 * Angular CDK's autosize and Mantine's both do.
 */
test('grows through the platform and withdraws the handle while it does', () => {
  const auto = rule(`${root}[data-auto-size]`);
  assert.equal(contract.autoSizeMechanism, 'field-sizing');
  assert.match(auto, /field-sizing:content/);
  assert.match(auto, /resize:none/);
});

/**
 * `block` rather than the platform's `both`: a control wider than its field
 * breaks the field's own grid, and a reader who widens one control in a form
 * has broken its alignment rather than fixed anything.
 */
test('offers all three resize axes and defaults to the one that is safe', () => {
  assert.equal(member.defaults.resize, 'block');
  assert.match(rule(root), /resize:block/);
  assert.match(rule(`${root}[data-resize='none']`), /resize:none/);
  assert.match(rule(`${root}[data-resize='both']`), /resize:both/);
});

/**
 * A pasted token with no break in it — a signed URL, a certificate, a
 * container digest — otherwise runs past the control's edge and takes the
 * page's horizontal scrollbar with it. Nothing is removed from the value.
 */
/**
 * The shadow and the ring are one decision, and the multi-line control answers
 * it the same way the single-line one does: the foundation's resting shadow, the
 * same shadow in the focus ring's colour while focused, and none at all on a
 * control nobody can reach.
 */
test('lifts the control at rest, in the state colour on focus, and never while disabled', () => {
  assert.match(
    rule(root),
    /box-shadow:var\(--slotted-textarea-shadow,var\(--slotted-control-shadow,none\)\)/,
  );
  assert.match(
    rule(`${root}:focus-visible`),
    /box-shadow:var\(--slotted-control-shadow-focus-geometry,[^)]*\) var\(--slotted-focus-ring-color/,
  );
  assert.match(rule(`${root}[data-disabled],${root}:disabled`), /box-shadow:none/);
});

/** One declaration moves the outline and the shadow together. */
test('points the focus ring at the invalid colour rather than repainting it', () => {
  assert.match(
    rule(`${root}[data-invalid]`),
    /--slotted-focus-ring-color:var\(--slotted-textarea-invalid-focus-ring-color,var\(--slotted-focus-ring-color-invalid/,
  );
});

test('breaks an unbreakable token rather than overflowing', () => {
  assert.match(rule(root), /overflow-wrap:anywhere/);
});

test('holds hover back for readonly, invalid and disabled', () => {
  for (const block of normalized.split('}').filter((entry) => entry.includes(':hover'))) {
    const head = block.split('{')[0] ?? '';
    if (!head.includes(root)) continue;
    assert.ok(head.includes(':not([data-disabled])'), `${head} answers hover while disabled`);
    assert.ok(
      head.includes(':not(:disabled)'),
      `${head} answers hover while the browser disabled it`,
    );
    assert.ok(head.includes(':not([data-readonly])'), `${head} answers hover while read-only`);
    assert.ok(head.includes(':not([data-invalid])'), `${head} answers hover while invalid`);
  }
  assert.ok(
    normalized.indexOf(`${root}[data-invalid]{`) > normalized.indexOf(`${root}:hover`),
    'invalid is written before hover and loses to it',
  );
});

test('keeps read-only legible and tells it apart from disabled', () => {
  const readonly = rule(`${root}[data-readonly]`);
  assert.match(readonly, /background-color:var\(--slotted-textarea-readonly-background/);
  assert.doesNotMatch(readonly, /color:var\(--slotted-disabled/);
  assert.doesNotMatch(readonly, /resize:none/);
});

/** A handle on a control nobody can type in is a handle that lies. */
test('answers a control the browser disabled and takes its handle away', () => {
  const disabled = rule(`${root}[data-disabled],${root}:disabled`);
  assert.match(disabled, /cursor:not-allowed/);
  assert.match(disabled, /resize:none/);
});

test('gives the borderless variant an edge under forced colours', () => {
  assert.ok(
    normalized.includes(
      `@media (forced-colors:active){${root}[data-variant='plain']{border-color:ButtonBorder;}`,
    ),
    'the plain variant keeps no edge under forced colours',
  );
});

/* ------------------------------------------------------------- fragment - */

test('renders every state the contract declares in at least one scene', () => {
  for (const [state, attribute] of Object.entries(contract.stateAttributes)) {
    assert.match(fragment, new RegExp(attribute), `${state} is in no scene`);
  }
});

test('exercises every step, variant and resize axis on the page', () => {
  for (const size of contract.axes.size) {
    assert.match(fragment, new RegExp(`data-size="${size}"`), `${size} is in no scene`);
  }
  for (const variant of contract.axes.variant) {
    assert.match(fragment, new RegExp(`data-variant="${variant}"`), `${variant} is in no scene`);
  }
  for (const resize of contract.axes.resize) {
    assert.match(fragment, new RegExp(`data-resize="${resize}"`), `${resize} is in no scene`);
  }
});

test('shows a control that grows, one that does not, and the ceiling between them', () => {
  assert.match(fragment, /data-auto-size/);
  assert.match(fragment, /--slotted-textarea-max-rows/);
  assert.match(fragment, /data-ui="field"/);
  assert.match(fragment, /data-part="counter"/);
});
