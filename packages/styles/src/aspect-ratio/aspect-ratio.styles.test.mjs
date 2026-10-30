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
    new URL('../../../../specs/components/aspect-ratio/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./aspect-ratio.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./aspect-ratio.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
/**
 * Whitespace is collapsed rather than removed: a descendant selector and a
 * multi-word value both lose their meaning when every space goes.
 */
const normalized = declarations
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const root = `${ui}[data-part-root]`;

const rules = [...normalized.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .filter(([, selector]) => !selector.includes('@'))
  .map(([, selector, body]) => ({
    selectors: selector.split(',').map((one) => one.trim()),
    body,
  }));

function rule(selector) {
  return rules.find((candidate) => candidate.selectors.includes(selector))?.body ?? '';
}

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('is selected by the identifier the contract declares', () => {
  assert.ok(normalized.includes(`${root}{`), 'the family has no base rule keyed on data-ui');
});

test('names the family and the part together, so a rule for the box stays on the box', () => {
  for (const selector of normalized.matchAll(/(^|\})([^{}]+)\{/g)) {
    for (const part of (selector[2] ?? '').split(',')) {
      if (!part.includes(`[data-part-root]`)) continue;
      assert.ok(part.includes(ui), `"${part.trim()}" reaches the root without naming the family`);
    }
  }
});

/**
 * The ratio is the platform's property and not the padding hack, which is
 * what gives the frame its growth rule: css-sizing-4 keeps a content-based
 * minimum on a box with `aspect-ratio`, so content taller than the ratio
 * grows the box rather than leaving it. The base rule reads the public token,
 * so a number the consumer stated on the instance wins over any name.
 */
test('reserves the ratio with the platform’s own property, read from the public token', () => {
  const body = rule(root);
  assert.ok(body.includes('aspect-ratio:var(--slotted-aspect-ratio,1 / 1)'));
  assert.ok(!normalized.includes('padding-block-end:'), 'the padding hack is not this frame');
  assert.ok(!normalized.includes('position:absolute'), 'nothing is taken out of the flow');
  assert.ok(!/overflow:(hidden|clip)/.test(body), 'the frame reserves and never crops');
});

/**
 * Every name the contract declares writes the same token the base rule
 * reads, as the pair the contract holds; `custom` writes nothing, because
 * the instance already did.
 */
test('writes every named ratio into the token, and leaves custom to the instance', () => {
  for (const [name, [w, h]] of Object.entries(contract.namedRatios)) {
    assert.ok(
      rule(`${root}[data-ratio='${name}']`).includes(`--slotted-aspect-ratio:${w} / ${h}`),
      `${name} does not write ${w} / ${h}`,
    );
  }
  assert.ok(!normalized.includes(`[data-ratio='custom']`));
});

/**
 * A grid of one cell whose row keeps its content minimum: `minmax(0, 1fr)`
 * would have nothing to grow from. Every child takes the cell, so a caption
 * stacks over a map without the consumer positioning anything.
 */
test('is a grid of one cell whose row can still grow', () => {
  const body = rule(root);
  assert.ok(body.includes('display:grid'));
  assert.ok(body.includes('grid-template-rows:1fr'));
  assert.ok(!body.includes('grid-template-rows:minmax(0'));
  assert.ok(rule(`${root} > *`).includes('grid-area:1 / 1'));
});

/**
 * A replaced child is sized to the cell, told to fit rather than to fill,
 * and given a zero block minimum: a grid item's automatic minimum is
 * content-based and treats a percentage height as `auto` while the row is
 * sized, so without it a 4:3 photograph grew a 16:9 frame to 4:3. Text
 * keeps its minimum, and the growth rule with it.
 */
test('fits replaced content whole, and keeps it from growing the frame', () => {
  const replaced =
    /:is\(img,video,canvas,svg,iframe,picture\)\{([^}]*)\}/.exec(normalized)?.[1] ?? '';
  assert.ok(replaced.includes('block-size:100%'));
  assert.ok(replaced.includes('inline-size:100%'));
  assert.ok(replaced.includes('min-block-size:0'));
  assert.ok(/:is\(img,video\)\{object-fit:contain;?\}/.test(normalized));
  assert.ok(!normalized.includes('object-fit:cover'), 'the crop is image’s decision');
  assert.ok(!rule(`${root} > *`).includes('min-block-size'), 'text keeps its content minimum');
});

test('exercises every named ratio, a custom one, replaced content, growth and the composition', () => {
  for (const name of contract.axes.ratio) {
    assert.ok(fragment.includes(`data-ratio="${name}"`), `no scene shows ${name}`);
  }
  for (const scene of ['ratios', 'custom', 'media', 'growth', 'composition']) {
    assert.ok(fragment.includes(`data-scene="${scene}"`), `no ${scene} scene`);
  }
  assert.ok(
    fragment.includes('--slotted-aspect-ratio: 2 / 1'),
    'custom is written on the instance',
  );
  assert.ok(fragment.includes(`data-ui="image"`), 'the composition scene renders image');
});
