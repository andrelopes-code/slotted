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
    new URL('../../../../specs/components/stack/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./stack.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./stack.harness.html', import.meta.url), 'utf8'),
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

test('arranges along the block axis, which is what makes it a stack', () => {
  const base = ruleFor(ui);
  assert.ok(base.includes('display:flex'));
  assert.ok(base.includes('flex-direction:column'));
});

test('separates by the default step until a step is asked for', () => {
  const step = contract.members.stack.defaults.gap;
  assert.ok(ruleFor(ui).includes(`--_gap:var(--slotted-space-${step},`));
  assert.ok(ruleFor(ui).includes('gap:var(--_gap)'));
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

test('names every alignment the contract declares', () => {
  for (const align of contract.axes.align) {
    assert.ok(normalized.includes(`${ui}[data-align='${align}']{`), `Missing align ${align}`);
  }
  for (const justify of contract.axes.justify) {
    assert.ok(
      normalized.includes(`${ui}[data-justify='${justify}']{`),
      `Missing justify ${justify}`,
    );
  }
});

test('positions across the flow with align, and along it with justify', () => {
  assert.ok(ruleFor(`${ui}[data-align='center']`).includes('align-items:center'));
  assert.ok(ruleFor(`${ui}[data-justify='center']`).includes('justify-content:center'));
});

test('takes the logical keyword, so a mirrored document needs no second stylesheet', () => {
  assert.equal(ruleFor(`${ui}[data-align='start']`), 'align-items:start;');
  assert.equal(ruleFor(`${ui}[data-align='end']`), 'align-items:end;');
  assert.doesNotMatch(declarations, /flex-(start|end)/);
});

test('shrinks below its content so a nested stack reflows instead of overflowing', () => {
  assert.ok(ruleFor(ui).includes('min-inline-size:0'));
});

test('paints nothing at all: a layout that carried a colour would be a surface', () => {
  assert.doesNotMatch(declarations, /(^|[;{\s])(color|background|border|box-shadow|padding)\s*:/);
});

test('reorders nothing, so the reading order stays the order of the document', () => {
  assert.doesNotMatch(declarations, /(column|row)-reverse|(^|[;{\s])order\s*:/);
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
