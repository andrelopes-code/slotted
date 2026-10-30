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
  readFileSync(new URL('../../../../specs/components/icon/contract.json', import.meta.url), 'utf8'),
);
const css = readFileSync(new URL('./icon.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./icon.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations.replace(/\s+/g, '');
const ui = `[data-ui-${contract.ui.toLowerCase()}]`;
const base = normalized.split(`${ui}{`)[1]?.split('}')[0] ?? '';

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('is selected by the identifier the contract declares', () => {
  assert.ok(normalized.includes(`${ui}{`), 'the family has no base rule keyed on data-ui');
});

test('is a square box that keeps its size in a flex row', () => {
  assert.ok(base.includes('inline-size:var(--_size)'), 'the box states no inline size');
  assert.ok(base.includes('block-size:var(--_size)'), 'the box states no block size');
  assert.ok(base.includes('flex:none'), 'an icon that shrinks is not a box');
});

test('reads its size through the token a container sets, not from a literal', () => {
  assert.ok(
    base.includes('--_size:var(--slotted-icon-size,var(--slotted-control-icon-size-md'),
    'the base size does not defer to --slotted-icon-size',
  );
});

test('gives every size step the scale the foundation already holds', () => {
  for (const size of contract.axes.size) {
    const rule = normalized.split(`${ui}[data-size='${size}']{`)[1]?.split('}')[0] ?? '';
    assert.ok(rule.length > 0, `Missing size ${size}`);
    assert.ok(
      rule.startsWith('--slotted-icon-size:'),
      `${size} sets something other than the family size token`,
    );
    if (size === 'text') {
      assert.ok(rule.includes('1em'), 'text does not follow the type it sits in');
      continue;
    }
    assert.ok(
      rule.includes(`var(--slotted-control-icon-size-${size}`),
      `${size} invents a scale instead of reading the control icon scale`,
    );
  }
});

test('makes the artwork fill the box, through a host component if there is one', () => {
  for (const selector of [`${ui}>*,`, `${ui}svg{`]) {
    assert.ok(normalized.includes(selector), `no rule sizes ${selector}`);
  }
  const rule = normalized.split(`${ui}svg{`)[1]?.split('}')[0] ?? '';
  assert.ok(rule.includes('inline-size:100%') && rule.includes('block-size:100%'));
});

test('takes the color of its context until a tone is asked for', () => {
  assert.ok(!base.includes('color:'), 'the base rule paints a color, so inheritance is lost');
  for (const tone of contract.axes.tone.filter((value) => value !== 'inherit')) {
    assert.ok(normalized.includes(`${ui}[data-tone='${tone}']{color:var(`), `Missing tone ${tone}`);
  }
});

test('never states fill or stroke, because it does not own the geometry', () => {
  assert.doesNotMatch(declarations, /(?:^|[;{\s])(?:fill|stroke)\s*:/);
});

test('mirrors only what is declared directional, and only where reading runs the other way', () => {
  const selector = `${ui}[data-directional]:dir(rtl){`;
  assert.ok(normalized.includes(selector), 'nothing mirrors in a right-to-left document');
  const rule = normalized.split(selector)[1]?.split('}')[0] ?? '';
  assert.equal(rule, 'scale:-11;');
  assert.doesNotMatch(declarations, /\[dir=/, 'an ancestor selector cannot read a nested island');
});

/**
 * The one purely optical decision the family makes, and the one a constant
 * cannot hold: the correction an icon needs depends on how large it is against
 * the type it sits in, so the default has to name both. A stated length is
 * right at one ratio and visibly wrong at every other — a large step inside
 * small type rides above the line it belongs to.
 */
test('corrects the optical line from the type and the box, not from a constant', () => {
  const shift = /vertical-align:\s*([^;]+);/.exec(css)?.[1] ?? '';

  assert.match(shift, /var\(--slotted-icon-baseline-shift,/, 'a theme cannot retune the shift');
  assert.match(shift, /cap\b/, 'the correction ignores the cap height of the type it sits in');
  assert.match(shift, /var\(--_size\)/, 'the correction ignores how large the box is');
  assert.doesNotMatch(
    shift.replace(/var\([^)]*\)/g, ''),
    /-?\d*\.?\d+(em|rem|px)/,
    'a stated length is right at one ratio and wrong at every other',
  );
});

test('states no duration, because an icon does not move', () => {
  assert.doesNotMatch(css, /transition|animation/);
});

test('writes no forced-colors rule, because it paints nothing the theme cannot reach', () => {
  assert.doesNotMatch(css, /forced-colors/);
});

test('exercises every declared part, and both painting conventions, in the fragment', () => {
  for (const member of Object.values(contract.members)) {
    for (const part of member.parts) {
      assert.ok(fragment.includes(`data-part="${part}"`), `no scene renders the ${part} part`);
    }
  }
  assert.match(fragment, new RegExp(`data-ui="${contract.ui}"`));
  assert.match(fragment, /stroke="currentColor"/, 'no stroked artwork is on the page');
  assert.match(fragment, /fill="currentColor"/, 'no filled artwork is on the page');
  assert.match(fragment, /data-directional/, 'no scene shows the mirrored case');
  assert.match(fragment, /role="img"/, 'no scene shows an icon that carries a name');
});

test('sizes a glyph host inside the box through the font it reads', () => {
  // A glyph component such as `ng-icon` sizes its own host at `1em` from a
  // stylesheet outside any layer, which no normal declaration in the component
  // layer outranks. The box therefore does not fight that host: it gives the
  // host a font-size equal to the box, and `1em` is then the box.
  const rule = normalized.split(`${ui}>*,`)[1]?.split('}')[0] ?? '';
  assert.ok(rule.includes('font-size:var(--_size)'), 'the host is left at the text’s font-size');
});
