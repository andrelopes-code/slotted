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
    new URL('../../../../specs/components/slider/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./slider.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./slider.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:>])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const root = `${ui}[data-part-root]`;
const member = contract.members.slider;
/** The whole sheet with every space taken out, for matching a computed length. */
const tight = normalized.replace(/\s/g, '');

/**
 * The declarations of the first rule whose selector starts with `selector`,
 * with every space taken out. `calc()` keeps the spaces around its operators
 * through normalisation, so matching a computed length against a pattern that
 * guessed at them is how a passing rule reads as a missing one.
 */
function rule(selector) {
  return (normalized.split(`${selector}{`)[1]?.split('}')[0] ?? '').replace(/\s/g, '');
}

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('is selected by the identifier the contract declares', () => {
  assert.ok(normalized.includes(`${root}{`), 'the family has no base rule keyed on data-ui');
});

test('styles every part the contract declares', () => {
  for (const part of member.parts) {
    assert.ok(
      normalized.includes(`[data-part-${part.toLowerCase()}]`),
      `no rule reaches the ${part} part`,
    );
  }
});

/**
 * The thumb a reader sees is this family's element; the input under it keeps
 * the role, the value and its place in the form. It has to be invisible and
 * unhittable, and it must not disappear from the tab order: `opacity` rather
 * than `display` or `visibility`.
 */
test('hides the native control without taking it out of the tab order', () => {
  const input = rule(`${ui} [data-part-input]`);
  assert.match(input, /opacity:0/);
  assert.match(input, /pointer-events:none/);
  assert.match(input, /position:absolute/);
  assert.ok(!/display:none/.test(input), 'a hidden control is not a focusable one');
  assert.ok(!/visibility:hidden/.test(input), 'a hidden control is not a focusable one');
  assert.match(input, /outline:none/);
});

/**
 * The ring is drawn on the thumb because the input is `opacity: 0` and nothing
 * else in the family could draw it.
 */
test('draws focus on the thumb, from the input beneath it', () => {
  assert.ok(
    normalized.includes(`${ui} [data-part-thumb]:has(>[data-part-input]:focus-visible){`),
    'the thumb does not answer the input’s focus',
  );
});

/**
 * The rail is a channel: an edge that holds the ratio a non-text element needs
 * against every surface, and an interior a fill can be seen inside. Painted as
 * one flat neutral it cannot do both — in the `high-contrast` scheme every
 * neutral is the same black.
 */
test('draws the rail as a channel rather than as a line', () => {
  const track = rule(`${ui} [data-part-track]`);
  assert.match(track, /background-color:var\(--slotted-slider-track-color/);
  assert.match(track, /border:var\(--slotted-control-border-width,1px\)solid/);
  assert.match(track, /box-sizing:border-box/);
});

/**
 * Every position is a private custom property written by the binding. A
 * percentage of a track is geometry, and geometry is not a token.
 */
test('positions the fill, the marks and the thumbs from private properties', () => {
  assert.match(tight, /inset-inline-start:calc\(var\(--_start,0\)\*1%\)/);
  assert.match(tight, /inline-size:calc\(\(var\(--_end,0\)-var\(--_start,0\)\)\*1%\)/);
  assert.match(tight, /inset-inline-start:calc\(var\(--_position,0\)\*1%\)/);
  assert.ok(
    !/--slotted-slider-position/.test(css),
    'a position on a scale is not something a theme may retune',
  );
});

/**
 * The thumb is centred on its position by a logical margin rather than by a
 * `translate`, so the mirrored document needs no rule of its own.
 */
test('centres the thumb with a logical margin, not a physical transform', () => {
  const thumb = rule(`${ui}[data-orientation='horizontal'] [data-part-thumb]`);
  assert.match(thumb, /margin-inline-start:calc\(var\(--_thumb-size\)\/-2\)/);
  assert.ok(!/translate/.test(thumb), 'a percentage translate moves left in both directions');
});

/**
 * A vertical slider's minimum is at the bottom, which is where the browser's
 * own vertical range input and every surveyed implementation put it.
 */
test('measures a vertical scale from the block end', () => {
  const thumb = rule(`${ui}[data-orientation='vertical'] [data-part-thumb]`);
  assert.match(thumb, /inset-block-end:calc\(var\(--_position,0\)\*1%\)/);

  const indicator = rule(`${ui}[data-orientation='vertical'] [data-part-indicator]`);
  assert.match(indicator, /inset-block-end:calc\(var\(--_start,0\)\*1%\)/);
});

/**
 * The family declares no container. Inline-size containment makes a box's own
 * width independent of its contents, so a slider in a shrink-to-fit stage
 * computed its width as nought and disappeared — the React reference page
 * showed three read-outs and three bare thumbs with no rail under any of them.
 * A slider is fluid rather than reflowing: the rail shrinks and the thumb does
 * not.
 */
test('stays fluid rather than becoming a container that can collapse', () => {
  assert.ok(
    !/container-type/.test(css),
    'inline-size containment collapses a shrink-to-fit slider',
  );
  assert.ok(!/@container/.test(css));
  assert.ok(!/@media \(max-width/.test(css), 'a viewport query does not decide component layout');
  assert.match(rule(root), /min-inline-size:0/);
});

/**
 * The room the bubble stands in is reserved whether or not it is showing, so
 * the control does not move when a drag starts and the bubble never lands on
 * the read-out above it.
 */
test('reserves the bubble’s room instead of letting it land on the read-out', () => {
  assert.ok(
    normalized.includes(
      `${ui}[data-orientation='horizontal']:not([data-value-label='none']) [data-part-control]{`,
    ),
    'nothing reserves the bubble’s room',
  );
});

/**
 * `input[type=range]` is not in the list of types `readonly` applies to, so the
 * state is the family's to paint. It must be visible and must not be
 * mistakable for disabled.
 */
test('paints read-only, and not as disabled', () => {
  const indicator = rule(`${root}[data-readonly] [data-part-indicator]`);
  assert.match(indicator, /background-color:var\(--slotted-slider-readonly-indicator-color/);
  assert.ok(
    !/--slotted-disabled/.test(indicator),
    'read-only is a value nobody may change, not a value nobody may read',
  );
});

/**
 * A control can be disabled by something that never told it so: a disabled
 * `fieldset` disables every control inside it.
 */
test('answers a control the browser disabled without being told', () => {
  assert.ok(normalized.includes(`${root}:has([data-part-input]:disabled) [data-part-track]`));
});

test('takes every duration and easing from the motion scale', () => {
  const thumb = rule(`${ui} [data-part-thumb]`);
  assert.match(thumb, /var\(--slotted-control-transition-duration\)/);
  assert.match(thumb, /var\(--slotted-control-transition-easing\)/);
});

/**
 * The theme cannot repaint three backgrounds into three different things under
 * forced colours, so the family writes the one block it owns.
 */
test('keeps the rail, the fill and the thumb apart under forced colours', () => {
  const forced = normalized.split('@media (forced-colors:active){')[1]?.replace(/\s/g, '') ?? '';
  assert.match(forced, /\[data-part-track\]\{background-color:ButtonFace/);
  assert.match(forced, /\[data-part-indicator\]\{background-color:Highlight/);
});

test('renders every declared part in the harness fragment', () => {
  for (const part of member.parts) {
    assert.match(fragment, new RegExp(`data-part="${part}"`), `the fragment omits ${part}`);
  }
});

test('exercises every declared state in the harness fragment', () => {
  for (const [state, attribute] of Object.entries(contract.stateAttributes)) {
    assert.match(fragment, new RegExp(attribute), `the fragment never shows ${state}`);
  }
});

test('shows both orientations and every size in the harness fragment', () => {
  for (const orientation of contract.axes.orientation) {
    assert.match(fragment, new RegExp(`data-orientation="${orientation}"`));
  }
  for (const size of contract.axes.size) {
    assert.match(fragment, new RegExp(`data-size="${size}"`));
  }
  for (const label of contract.axes.valueLabel) {
    assert.match(fragment, new RegExp(`data-value-label="${label}"`));
  }
});
