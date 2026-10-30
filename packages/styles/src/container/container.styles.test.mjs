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
    new URL('../../../../specs/components/container/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./container.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./container.harness.html', import.meta.url), 'utf8'),
);

const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
/** One space between tokens, so a wrapped declaration reads the same as a short one. */
const collapsed = declarations.replace(/\s+/g, ' ');
const ui = `[data-ui-${contract.ui.toLowerCase()}]`;

const ruleFor = (selector) => collapsed.split(`${selector} {`)[1]?.split('}')[0]?.trim() ?? '';

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('is selected by the identifier the contract declares', () => {
  assert.ok(ruleFor(ui) !== '', 'the family has no base rule keyed on data-ui');
});

test('lays three tracks: a start gutter, the bounded column, an end gutter', () => {
  const base = ruleFor(ui);
  assert.ok(base.includes('display: grid'));
  assert.ok(
    base.includes(
      'grid-template-columns: [full-start] minmax(var(--_inset), var(--_start-track)) ' +
        '[content-start] min(100% - 2 * var(--_inset), var(--_max)) ' +
        '[content-end] minmax(var(--_inset), var(--_end-track)) [full-end]',
    ),
    `the three tracks are not the ones the design states:\n${base}`,
  );
});

test('names the two areas a child can be placed in', () => {
  assert.equal(
    ruleFor(`${ui} > *`).includes('grid-column: content'),
    true,
    'a child belongs to the bounded column',
  );
  assert.equal(
    ruleFor(`${ui} > [data-part-breakout]`).includes('grid-column: full'),
    true,
    'a breakout spans every track, which is what makes it a breakout',
  );
});

test('insets by flooring the gutters, never by padding the box', () => {
  assert.doesNotMatch(
    declarations,
    /padding/,
    'padding would inset the breakout too, which is the one thing it exists not to be',
  );
});

test('fills the space it is given, so the maximum belongs to the column', () => {
  assert.ok(ruleFor(ui).includes('inline-size: 100%'));
});

test('lets a child narrower than its content hold the column instead of pushing it', () => {
  assert.ok(
    ruleFor(`${ui} > *`).includes('min-inline-size: 0'),
    'an unbreakable token would widen the track and scroll the page sideways',
  );
});

test('maps every size step the contract declares', () => {
  for (const size of contract.axes.size) {
    assert.notEqual(ruleFor(`${ui}[data-size='${size}']`), '', `Missing size ${size}`);
  }
});

test('states the measure in characters, because that is the unit a measure has', () => {
  assert.match(
    ruleFor(`${ui}[data-size='measure']`),
    /--_max: var\(--slotted-container-measure, \d+ch\);/,
    'a measure stated in pixels gets longer in characters when the reader enlarges the text',
  );
});

test('keeps the measure under the eighty characters WCAG SC 1.4.8 allows', () => {
  const [, characters] = /--slotted-container-measure, (\d+)ch/.exec(css) ?? [];
  assert.ok(characters !== undefined, 'the measure states no character count');
  assert.ok(Number(characters) <= 80, `${characters}ch exceeds the SC 1.4.8 ceiling`);
});

test('bounds every bounded step by a family token with a rem fallback', () => {
  for (const [size, token] of [
    ['content', '--slotted-container-content'],
    ['wide', '--slotted-container-wide'],
    ['full', '--slotted-container-full'],
  ]) {
    assert.match(
      ruleFor(`${ui}[data-size='${size}']`),
      new RegExp(`--_max: var\\(${token}, [\\d.]+rem\\);`),
      `size ${size} does not reach its family token`,
    );
  }
});

test('keeps the bounded steps in the order their names put them', () => {
  const remOf = (size) =>
    Number.parseFloat(/, ([\d.]+)rem\)/.exec(ruleFor(`${ui}[data-size='${size}']`))?.[1] ?? '0');
  assert.ok(remOf('wide') > remOf('content'), 'wide is not wider than content');
  assert.ok(remOf('full') > remOf('wide'), 'full is not wider than wide');
});

/**
 * The value written without thinking is the bounded one. `full` on every route
 * of an application was what an ultra-wide display made unreadable, so the
 * ceiling is what `full` means and the absence of one is asked for by name.
 */
test('removes the maximum under bleed, and nowhere else', () => {
  assert.equal(
    ruleFor(`${ui}[data-size='bleed']`),
    '--_max: 100%;',
    'bleed is the absence of a maximum, and the gutters stay',
  );
  assert.doesNotMatch(ruleFor(`${ui}[data-size='full']`), /100%/);
});

test('maps every inset step to the space token of the same name', () => {
  for (const step of contract.axes.inset) {
    const rule = ruleFor(`${ui}[data-inset='${step}']`);
    assert.notEqual(rule, '', `Missing inset ${step}`);
    if (step === '0') {
      assert.equal(rule, '--_inset: 0px;', 'the absence of an inset is zero, not a token');
      continue;
    }
    assert.match(
      rule,
      new RegExp(`^--_inset: var\\(--slotted-space-${step}, [\\d.]+rem\\);$`),
      `inset ${step} does not resolve to the step of the same name`,
    );
  }
});

test('keeps the themeless inset fallbacks in the order the scale puts them', () => {
  const lengths = contract.axes.inset
    .filter((step) => step !== '0')
    .map((step) =>
      Number.parseFloat(
        /, ([\d.]+)rem\)/.exec(ruleFor(`${ui}[data-inset='${step}']`))?.[1] ?? 'NaN',
      ),
    );
  for (let index = 1; index < lengths.length; index += 1) {
    assert.ok(
      lengths[index] > lengths[index - 1],
      `inset ${index + 1} falls back to ${lengths[index]}rem, which is not larger than the step below`,
    );
  }
});

test('places the column by the growth limit of a gutter, so the keyword is logical', () => {
  assert.equal(ruleFor(`${ui}[data-align='center']`), '--_start-track: 1fr; --_end-track: 1fr;');
  assert.equal(ruleFor(`${ui}[data-align='start']`), '--_start-track: var(--_inset);');
  assert.equal(ruleFor(`${ui}[data-align='end']`), '--_end-track: var(--_inset);');
  assert.doesNotMatch(declarations, /\b(left|right)\b/);
});

test('paints nothing at all: a layout that carried a color would be a surface', () => {
  assert.doesNotMatch(declarations, /(^|[;{\s])(color|background|border|box-shadow)\s*:/);
});

test('reorders nothing, so the reading order stays the order of the document', () => {
  assert.doesNotMatch(declarations, /(column|row)-reverse|(^|[;{\s])order\s*:|grid-auto-flow/);
});

test('states no duration, because nothing here moves', () => {
  assert.doesNotMatch(css, /transition|animation/);
});

test('answers its own inline size intrinsically, not at a breakpoint', () => {
  assert.doesNotMatch(
    css,
    /@media|@container|container-type|container-name/,
    'min() and minmax() collapse continuously; a breakpoint would add a step to be unstable around',
  );
});

test('exercises every declared part in the harness fragment', () => {
  for (const member of Object.values(contract.members)) {
    for (const part of member.parts) {
      assert.ok(fragment.includes(`data-part="${part}"`), `no scene renders the ${part} part`);
    }
  }
  assert.match(fragment, new RegExp(`data-ui="${contract.ui}"`));
});

test('exercises every step of every axis in the harness fragment', () => {
  for (const [axis, values] of Object.entries(contract.axes)) {
    for (const value of values) {
      if (axis === 'inset' && !['0', '2', '6', '9'].includes(value)) continue;
      assert.ok(fragment.includes(`data-${axis}="${value}"`), `no scene renders ${axis} ${value}`);
    }
  }
});
