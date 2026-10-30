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
    new URL('../../../../specs/components/upload/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./upload.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./upload.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
/**
 * Whitespace collapsed rather than removed, and parentheses closed up: a
 * descendant selector and a multi-word value both lose their meaning when
 * every space goes, and the formatter breaks a long value across lines and
 * leaves `var( --token`, which no assertion here spells.
 */
const normalized = declarations
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');
const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const member = contract.members.upload;

/** The declarations of the first rule whose selector starts with `selector`. */
function rule(selector) {
  return normalized.split(`${selector}{`)[1]?.split('}')[0] ?? '';
}

/**
 * The declarations of the rule whose selector is exactly `selector`. `rule`
 * reads a prefix, so a grouped selector that merely starts the same way — the
 * private properties are declared for the root and the viewer at once — is the
 * rule it finds first.
 */
function exactRule(selector) {
  for (const chunk of normalized.split('}')) {
    const parts = chunk.split('{');
    if (parts.length > 1 && parts.at(-2)?.trim() === selector) return parts.at(-1) ?? '';
  }
  return '';
}

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('is selected by the identifier the contract declares', () => {
  assert.ok(normalized.includes(`${ui}[data-part-root]{`), 'no base rule keyed on data-ui');
});

test('styles every part the contract declares', () => {
  for (const part of member.parts) {
    if (part === 'root') continue;
    assert.ok(
      normalized.includes(`[data-part-${part.toLowerCase()}]`),
      `no rule reaches the ${part} part`,
    );
  }
});

test('renders every part and every state somewhere on the harness page', () => {
  for (const part of member.parts) {
    assert.ok(fragment.includes(`data-part="${part}"`), `${part} is on no harness scene`);
  }
  for (const [state, attribute] of Object.entries(contract.stateAttributes)) {
    assert.ok(fragment.includes(attribute), `${state} is exercised on no harness scene`);
  }
  for (const status of contract.statuses) {
    assert.ok(fragment.includes(`data-status="${status}"`), `${status} is on no harness scene`);
  }
});

/**
 * The `<label>` is the trigger and the control is inside it, so the accessible
 * name is three words rather than every word in the region. The harness is the
 * third place this DOM is written, after React and Angular, and it is the one
 * that can drift silently.
 */
test('puts the control inside the trigger on every scene that has one', () => {
  const triggers = fragment.match(/<label data-part="trigger">/g) ?? [];
  const inputs = fragment.match(/<input data-part="input"/g) ?? [];
  assert.ok(triggers.length >= 6, 'the fragment stopped drawing the trigger as a label');
  assert.equal(triggers.length, inputs.length, 'a trigger without its control, or the reverse');
});

/**
 * Clipped, and removed from nothing else. `display: none` and
 * `visibility: hidden` take the control out of the tab order and out of the
 * accessibility tree, which discards the reason the label pairing exists.
 */
test('clips the control rather than hiding it', () => {
  const input = rule(`${ui} [data-part-input]`);
  assert.ok(input.includes('clip-path:inset(50%)'));
  assert.ok(input.includes('position:absolute'));
  assert.ok(!/display:none/.test(input), 'the control was hidden from the accessibility tree');
  assert.ok(!/visibility:hidden/.test(input), 'the control was hidden from the accessibility tree');
});

/**
 * The ring is drawn on the trigger, because what holds focus is one clipped
 * pixel — and the ring the browser would draw there has to go, or a focused
 * trigger carries two rings in two colours.
 */
test('draws the ring on the trigger and suppresses the browser’s own', () => {
  assert.ok(
    normalized.includes(`${ui} [data-part-trigger]:has(:focus-visible){`),
    'the ring is not reached through the control inside the trigger',
  );
  assert.ok(rule(`${ui} [data-part-input]:focus-visible`).includes('outline:none'));
});

/**
 * A dashed edge says the box is waiting for something. A solid edge of the same
 * weight reads as a fieldset, which is the one thing the region is not.
 */
test('draws the region with a dashed edge', () => {
  assert.match(
    rule(`${ui} [data-part-dropzone]`),
    /border:var\(--_zone-border-width\) dashed var\(--_zone-border-color\)/,
  );
});

/**
 * Three drag facts, three different pictures: a drag over the document, a drag
 * this region will take, and one it has already decided to refuse.
 */
test('paints the accepted and the refused drag differently', () => {
  const target = rule(`${ui} [data-part-dropzone][data-drop-target]`);
  const invalid = rule(`${ui} [data-part-dropzone][data-drop-invalid]`);
  assert.ok(target.includes('--_zone-border-color:var(--slotted-tone-accent-border)'));
  assert.ok(invalid.includes('--_zone-border-color:var(--slotted-tone-danger-border)'));
  assert.notEqual(target, invalid);
});

/**
 * Four hundred files is a scroll region, not four hundred rows. The bound is in
 * rows because that is the unit the consumer stated it in.
 */
test('bounds the list in rows and lets the platform scroll the rest', () => {
  const list = rule(`${ui} [data-part-list]`);
  assert.match(list, /max-block-size:calc\(var\(--slotted-upload-visible-rows,6\)/);
  assert.ok(list.includes('overflow-y:auto'));
});

/**
 * Nine rows in the room for three scroll; they do not compress. A flex child
 * shrinks by default, so the rows were squeezed to slivers — the tile
 * flattened, the names spilled out of the rows, and nothing scrolled, because
 * the content had been made to fit the box.
 */
test('scrolls a bounded list rather than squeezing the rows inside it', () => {
  assert.ok(
    rule(`${ui} [data-part-item]`).includes('flex:none'),
    'a row may be shrunk below its own content',
  );
  const list = rule(`${ui} [data-part-list]`);
  assert.ok(list.includes('overflow-y:auto'));
});

/**
 * A panel that states its own height takes the room out of the queue and out
 * of nothing else. Every part above the list held `flex` at its default, so a
 * short panel took the room from the last part that could give it: the list
 * went to nought pixels inside an 18rem panel while the region kept every one
 * of its own, and the queue was gone with no scrollbar to say so.
 */
test('gives a short panel the queue and never the chrome around it', () => {
  for (const part of ['label', 'description', 'dropzone', 'summary']) {
    assert.ok(
      rule(`${ui} [data-part-${part.toLowerCase()}]`).includes('flex:none'),
      `${part} may be shrunk by a panel around it`,
    );
  }
  const list = rule(`${ui} [data-part-list]`);
  assert.ok(list.includes('flex:1 1 auto'), 'the list is not the part that gives');
  assert.ok(
    list.includes('min-block-size:var(--_row-block-size)'),
    'the list has no floor, so it disappears instead of scrolling',
  );
});

/**
 * The viewer is a layer, and a layer is portalled to the end of the document:
 * it is selected by the family's own identifier rather than as a descendant of
 * the root, and it stands on the whole of the panel it is given. Written as a
 * descendant it matched nothing, and the viewer opened unstyled.
 */
test('draws the viewer wherever the layer lands', () => {
  assert.ok(
    normalized.includes(`${ui}[data-part-viewer]{`),
    'the viewer is written as a descendant of the family it is portalled out of',
  );
  const viewer = exactRule(`${ui}[data-part-viewer]`);
  assert.ok(viewer.includes('grid-row:1 / -1'), 'the layer is taller than the viewer inside it');
  assert.ok(
    normalized.includes(`${ui}[data-part-root],${ui}[data-part-viewer]{`),
    'the portalled viewer inherits none of the private properties it reads',
  );
});

/**
 * The name shrinks to an ellipsis and the extension does not, so the part that
 * says what the file is survives the truncation.
 */
test('shrinks the name and never the extension', () => {
  const name = rule(`${ui} [data-part-name]`);
  assert.ok(name.includes('text-overflow:ellipsis'));
  assert.ok(name.includes('min-inline-size:0'), 'a flex child with no floor cannot truncate');
  assert.ok(rule(`${ui} [data-part-extension]`).includes('flex:none'));
  assert.ok(
    rule(`${ui} [data-part-item] > [data-part-body]`).includes('min-inline-size:0'),
    'the column that holds the name has no floor, so a long name pushes the controls out',
  );
});

/**
 * The five controls on a row are one rule with five marks, not five controls.
 * The marks are `Icon` elements the binding chooses; the sheet sizes all five
 * from one rule and paints none of them. `packages/styles/src/inner-control.test.mjs`
 * holds the rest of the R2 rule for each of them by name.
 */
test('gives a row’s five controls one box and sizes their five marks', () => {
  for (const part of ['start', 'pause', 'retry', 'cancel', 'remove']) {
    assert.ok(
      normalized.includes(`${ui} [data-part-${part.toLowerCase()}] > [data-ui-icon]`),
      `${part} does not size its icon`,
    );
  }
  assert.ok(
    rule(`${ui} [data-part-remove] > [data-ui-icon]`).includes(
      '--slotted-icon-size:var(--_action-glyph-size)',
    ),
  );
  assert.ok(!normalized.includes('mask-image'), 'a mark is an element, not a mask');
});

/**
 * A status said in colour alone fails WCAG 2.2 SC 1.4.1, so the row says it in
 * a word and the colour follows the word.
 */
test('says a status in a word before it says it in a colour', () => {
  assert.ok(rule(`${ui} [data-part-status]`).includes('color:var(--_status-text)'));
  for (const status of ['success', 'error', 'rejected']) {
    assert.ok(
      normalized.includes(`[data-part-item][data-status='${status}']`),
      `${status} tints nothing`,
    );
  }
});

/**
 * The region and the row answer the box they are in rather than the window: a
 * drop region goes in a sidebar, in a dialog and across a page in the same
 * application.
 */
test('owns its own container and queries it by name', () => {
  const root = rule(`${ui}[data-part-root]`);
  assert.ok(root.includes('container-name:slotted-upload'));
  assert.ok(root.includes('container-type:inline-size'));
  assert.ok(
    root.includes('inline-size:100%'),
    'an inline-size container has no intrinsic width, so a shrink-wrapping parent collapses it',
  );
  assert.match(normalized, /@container slotted-upload \(max-width:26rem\)/);
});

/**
 * The bar is `progress-indicator`'s. What this family owes is the room it
 * stands in; a second bar here would be a second answer to one question.
 */
test('gives the composed bar room and draws none of its own', () => {
  const progress = rule(`${ui} [data-part-progress]`);
  assert.ok(progress.includes('position:absolute'));
  assert.ok(progress.includes('inset-block-end:0'), 'the bar is not the row’s own bottom edge');
  assert.ok(progress.includes('inset-inline:0'));
  assert.ok(
    rule(`${ui} [data-part-item]`).includes('overflow:hidden'),
    'the row does not clip the bar to its own corners',
  );
  assert.ok(!/background-color/.test(progress), 'the family drew a track of its own');
  assert.ok(
    !normalized.includes(`data-ui='progress-indicator'`),
    'the family styles another family',
  );
});
