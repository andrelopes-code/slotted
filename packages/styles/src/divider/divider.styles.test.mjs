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
    new URL('../../../../specs/components/divider/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./divider.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./divider.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
/**
 * Whitespace is collapsed rather than removed: a descendant selector and a
 * multi-word value both lose their meaning when every space goes, which is how
 * an assertion about `flex: 1 0 <basis>` comes to read `flex:10var(`.
 */
const normalized = declarations.replace(/\s+/g, ' ').replace(/\s*([{};,:])\s*/g, '$1');
const ui = `[data-ui-${contract.ui.toLowerCase()}]`;

/** The declarations of the first rule whose selector starts with `selector`. */
function rule(selector) {
  return normalized.split(`${selector}{`)[1]?.split('}')[0] ?? '';
}

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('is selected by the identifier the contract declares', () => {
  assert.ok(normalized.includes(`${ui}{`), 'the family has no base rule keyed on data-ui');
});

test('removes the border the user agent draws on an hr', () => {
  assert.ok(rule(ui).includes('border:0'), 'the default hr border would double the rule');
});

/**
 * Both axes have to be claimed. A flex container hands the cross size over
 * through `align-self` and a grid hands the inline size over through
 * `justify-self`; a grid with `justify-items: start` and only the first of the
 * two leaves a horizontal rule sized from its content, which is nothing.
 */
test('takes a length from a container that packs rather than stretches', () => {
  assert.ok(rule(ui).includes('align-self:stretch'), 'a flex container decides the cross size');
  assert.ok(rule(ui).includes('justify-self:stretch'), 'a grid decides the inline size');
});

test('draws each orientation the contract names, on the axis it divides', () => {
  assert.ok(
    rule(`${ui}:not([data-labelled])[data-orientation='horizontal']`).includes(
      'border-block-start:',
    ),
    'a horizontal rule draws no line across the block start',
  );
  assert.ok(
    rule(`${ui}:not([data-labelled])[data-orientation='vertical']`).includes(
      'border-inline-start:',
    ),
    'a vertical rule draws no line down the inline start',
  );
  assert.deepEqual(contract.axes.orientation, ['horizontal', 'vertical']);
});

test('occupies the thickness it draws and nothing more', () => {
  assert.ok(
    rule(`${ui}:not([data-labelled])[data-orientation='horizontal']`).includes('block-size:0'),
    'a horizontal rule keeps a box under its line',
  );
  assert.ok(
    rule(`${ui}:not([data-labelled])[data-orientation='vertical']`).includes('inline-size:0'),
    'a vertical rule keeps a box beside its line',
  );
});

test('gives each orientation a floor for the container that sizes it not at all', () => {
  assert.ok(
    rule(`${ui}:not([data-labelled])[data-orientation='vertical']`).includes(
      'min-block-size:var(--slotted-divider-min-length',
    ),
  );
  assert.ok(
    rule(`${ui}:not([data-labelled])[data-orientation='horizontal']`).includes(
      'min-inline-size:var(--slotted-divider-min-length',
    ),
  );
});

test('stops short of both ends of the container on the axis it runs along', () => {
  assert.ok(
    rule(`${ui}[data-inset][data-orientation='horizontal']`).includes(
      'margin-inline:var(--slotted-divider-inset',
    ),
  );
  assert.ok(
    rule(`${ui}[data-inset][data-orientation='vertical']`).includes(
      'margin-block:var(--slotted-divider-inset',
    ),
  );
});

test('interrupts the line for a label instead of putting a box beside it', () => {
  assert.ok(rule(`${ui}[data-labelled]`).includes('display:flex'));
  assert.ok(
    normalized.includes(`${ui}[data-labelled]::before,${ui}[data-labelled]::after{`),
    'the two halves of a labelled rule are not drawn by the element itself',
  );
});

test('keeps a stub of rule on each side of a label in a narrow container', () => {
  assert.ok(rule(`${ui}[data-labelled]::before,${ui}[data-labelled]::after`).includes('flex:1 0'));
});

test('drops the half a label at one end does not need', () => {
  assert.ok(
    rule(
      `${ui}[data-labelled][data-align='start']::before,${ui}[data-labelled][data-align='end']::after`,
    ).includes('display:none'),
  );
  assert.deepEqual(contract.axes.align, ['start', 'center', 'end']);
});

test('reads the label from the type scale rather than deciding a size of its own', () => {
  const label = rule(`${ui} [data-part-label]`);
  assert.ok(label.includes('font-size:var(--slotted-font-size-xs'));
  assert.ok(label.includes('line-height:var(--slotted-line-height-xs'));
  assert.ok(label.includes('color:var(--slotted-divider-label-color'));
});

test('breaks a label that is longer than the container it stands in', () => {
  assert.ok(rule(`${ui} [data-part-label]`).includes('overflow-wrap:anywhere'));
});

test('lets unthemed decoration disappear rather than reach for a system colour', () => {
  for (const match of css.matchAll(/::(?:before|after)[^{]*\{([\s\S]*?)\}/g)) {
    assert.doesNotMatch(match[1] ?? '', /ButtonBorder|CanvasText|GrayText/);
  }
});

test('states no duration, because nothing here moves', () => {
  assert.doesNotMatch(css, /transition|animation/);
});

test('exercises every declared part in the harness fragment', () => {
  for (const part of contract.members.divider.parts) {
    assert.ok(fragment.includes(`data-part="${part}"`), `no scene renders the ${part} part`);
  }
  assert.match(fragment, new RegExp(`data-ui="${contract.ui}"`));
});
