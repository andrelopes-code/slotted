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
  readFileSync(new URL('../../../../specs/components/grid/contract.json', import.meta.url), 'utf8'),
);
const css = readFileSync(new URL('./grid.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./grid.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations.replace(/\s+/g, '');
const ui = `[data-ui-${contract.ui.toLowerCase()}]`;

const ruleFor = (selector) => normalized.split(`${selector}{`)[1]?.split('}')[0] ?? '';

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('is selected by the identifier the contract declares', () => {
  assert.ok(normalized.includes(`${ui}{`), 'the family has no base rule keyed on data-ui');
});

test('arranges across two axes, which is what makes it a grid', () => {
  const base = ruleFor(ui);
  assert.ok(base.includes('display:grid'));
  assert.ok(base.includes(`--_min-item:var(--slotted-grid-min-item-width-md,`));
  assert.ok(base.includes(`--_gap:var(--slotted-space-${contract.members.grid.defaults.gap},`));
  assert.ok(base.includes('gap:var(--_gap)'));
});

test('fits as many tracks as it can when no count is stated', () => {
  const base = ruleFor(ui);
  assert.ok(
    base.includes('grid-template-columns:repeat(auto-fit,minmax(min(100%,var(--_min-item)),1fr))'),
    'the unstated count does not become a track that fits itself to the container',
  );
});

test('treats a stated count as a ceiling the container may lower', () => {
  const rule = ruleFor(`${ui}[data-columns]`);
  assert.ok(rule.includes('repeat(auto-fill,'), 'a stated count keeps its empty tracks');
  assert.ok(
    rule.includes(
      'max(var(--_min-item),(100%-(var(--slotted-grid-columns,1)-1)*var(--_gap))/var(--slotted-grid-columns,1))',
    ),
    'the track is not the larger of the minimum and the share each column would take',
  );
});

test('never lets a minimum wider than the container overflow it', () => {
  for (const rule of [ruleFor(ui), ruleFor(`${ui}[data-columns]`)]) {
    assert.ok(
      rule.includes('minmax(min(100%,'),
      'without min(100%, …) a minimum wider than the container hangs past its edge',
    );
  }
});

test('reads the count from a custom property, because a track function cannot read an attribute', () => {
  assert.ok(normalized.includes('var(--slotted-grid-columns,1)'));
});

test('maps every step of the space scale to the token of the same name', () => {
  for (const step of contract.axes.gap) {
    const rule = ruleFor(`${ui}[data-gap='${step}']`);
    assert.notEqual(rule, '', `Missing gap ${step}`);
    if (step === '0') {
      assert.equal(rule, '--_gap:0;', 'the absence of separation is zero, not a token');
      continue;
    }
    assert.match(
      rule,
      new RegExp(`^--_gap:var\\(--slotted-space-${step},[\\d.]+rem\\);$`),
      `gap ${step} does not resolve to the step of the same name`,
    );
  }
});

test('keeps the themeless fallbacks in the order the scale puts them', () => {
  const lengths = contract.axes.gap
    .filter((step) => step !== '0')
    .map((step) => Number.parseFloat(fallbackOf(step)));
  for (let index = 1; index < lengths.length; index += 1) {
    assert.ok(
      lengths[index] > lengths[index - 1],
      `step ${index + 1} falls back to ${lengths[index]}rem, which is not larger than the step below it`,
    );
  }
});

test('gives every narrowest-cell step a token of its own, and widens with the step', () => {
  const widths = contract.axes.minItemWidth.map((step) => {
    const rule = ruleFor(`${ui}[data-min-item-width='${step}']`);
    const match = rule.match(
      new RegExp(`^--_min-item:var\\(--slotted-grid-min-item-width-${step},([\\d.]+)rem\\);$`),
    );
    assert.ok(match, `minItemWidth ${step} does not read a token of its own`);
    return Number.parseFloat(match[1]);
  });
  for (let index = 1; index < widths.length; index += 1) {
    assert.ok(widths[index] > widths[index - 1], `minItemWidth step ${index} does not widen`);
  }
});

test('names every alignment the contract declares, and no distribution', () => {
  for (const align of contract.axes.align) {
    assert.ok(normalized.includes(`${ui}[data-align='${align}']{`), `Missing align ${align}`);
  }
  for (const justify of contract.axes.justify) {
    assert.ok(
      normalized.includes(`${ui}[data-justify='${justify}']{`),
      `Missing justify ${justify}`,
    );
  }
  assert.doesNotMatch(
    declarations,
    /justify-content|align-content/,
    'filled tracks have nothing between them to distribute',
  );
});

test('positions a child inside its own cell on both axes', () => {
  assert.ok(ruleFor(`${ui}[data-align='center']`).includes('align-items:center'));
  assert.ok(ruleFor(`${ui}[data-justify='center']`).includes('justify-items:center'));
});

test('takes the logical keyword, so a mirrored document needs no second stylesheet', () => {
  assert.equal(ruleFor(`${ui}[data-justify='start']`), 'justify-items:start;');
  assert.equal(ruleFor(`${ui}[data-justify='end']`), 'justify-items:end;');
});

test('shrinks below its content so a nested grid reflows instead of overflowing', () => {
  assert.ok(ruleFor(ui).includes('min-inline-size:0'));
});

test('paints nothing at all: a layout that carried a colour would be a surface', () => {
  assert.doesNotMatch(declarations, /(^|[;{\s])(color|background|border|box-shadow|padding)\s*:/);
});

test('reorders and places nothing, so the reading order stays the order of the document', () => {
  assert.doesNotMatch(
    declarations,
    /grid-auto-flow|grid-column\s*:|grid-row|grid-template-areas|(^|[;{\s])order\s*:/,
  );
});

test('reflows by measuring itself, with no breakpoint and no container query', () => {
  assert.doesNotMatch(declarations, /@container|@media\s*\(\s*(min|max)-(width|inline-size)/);
});

test('states no duration, because nothing here moves', () => {
  assert.doesNotMatch(css, /transition|animation/);
});

test('exercises every declared part in the harness fragment', () => {
  for (const member of Object.values(contract.members)) {
    for (const part of member.parts) {
      assert.ok(fragment.includes(`data-part="${part}"`), `no scene renders the ${part} part`);
    }
  }
  assert.match(fragment, new RegExp(`data-ui="${contract.ui}"`));
});

/** The fallback the stylesheet states for one step, read back from its own rule. */
function fallbackOf(step) {
  const match = ruleFor(`${ui}[data-gap='${step}']`).match(/,([\d.]+rem)\);$/);
  assert.ok(match, `gap ${step} states no themeless fallback`);
  return match[1];
}
