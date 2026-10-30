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
    new URL('../../../../specs/components/typography/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./typography.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./typography.harness.html', import.meta.url), 'utf8'),
);
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations.replace(/\s+/g, '');
const ui = `[data-ui-${contract.ui.toLowerCase()}]`;

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('is selected by the identifier the contract declares', () => {
  assert.ok(normalized.includes(`${ui}{`), 'the family has no base rule keyed on data-ui');
});

test('paints every step of the type scale the contract names', () => {
  for (const size of contract.axes.size) {
    assert.ok(normalized.includes(`${ui}[data-size='${size}']{`), `Missing size ${size}`);
  }
});

test('pairs each step with the line height the scale puts beside it', () => {
  for (const size of contract.axes.size) {
    const rule = normalized.split(`${ui}[data-size='${size}']{`)[1]?.split('}')[0] ?? '';
    assert.ok(
      rule.includes(`font-size:var(--slotted-font-size-${size}`),
      `${size} reads no font size from the scale`,
    );
    assert.ok(
      rule.includes(`line-height:var(--slotted-line-height-${size}`),
      `${size} reads no line height from the scale`,
    );
  }
});

test('reads the scale itself rather than restating it as a family scale', () => {
  const familyTokens = [...normalized.matchAll(/var\((--slotted-typography-[a-z-]+)/g)].map(
    ([, name]) => name,
  );
  assert.deepEqual(
    [...new Set(familyTokens)].sort(),
    [
      '--slotted-typography-font-family',
      '--slotted-typography-lines',
      '--slotted-typography-uppercase-tracking',
    ],
    'a family token here means the family decided something the scale does not hold',
  );
});

test('names every weight, tone, alignment and wrap the contract declares', () => {
  for (const weight of contract.axes.weight) {
    assert.ok(normalized.includes(`${ui}[data-weight='${weight}']{`), `Missing weight ${weight}`);
  }
  for (const tone of contract.axes.tone.filter((value) => value !== 'inherit')) {
    assert.ok(normalized.includes(`${ui}[data-tone='${tone}']{`), `Missing tone ${tone}`);
  }
  for (const align of contract.axes.align) {
    assert.ok(normalized.includes(`${ui}[data-align='${align}']{`), `Missing align ${align}`);
  }
  for (const wrap of contract.axes.wrap) {
    assert.ok(normalized.includes(`${ui}[data-wrap='${wrap}']{`), `Missing wrap ${wrap}`);
  }
});

test('takes the color of its container until a tone is asked for', () => {
  const base = normalized.split(`${ui}{`)[1]?.split('}')[0] ?? '';
  assert.ok(!base.includes('color:'), 'the base rule paints a color, so inheritance is lost');
  assert.ok(normalized.includes(`${ui}[data-tone='default']{color:var(--slotted-text`));
});

test('shrinks its own minimum so a long token cannot widen the layout', () => {
  const base = normalized.split(`${ui}{`)[1]?.split('}')[0] ?? '';
  assert.ok(
    base.includes('overflow-wrap:anywhere'),
    'break-word leaves the min-content width of the longest token in place',
  );
});

test('clips the picture and keeps the string', () => {
  const rule = normalized.split(`${ui}[data-truncate]{`)[1]?.split('}')[0] ?? '';
  assert.ok(rule.includes('overflow:hidden'), 'nothing is clipped');
  assert.ok(rule.includes('line-clamp:var(--slotted-typography-lines'), 'no line count is read');
  assert.ok(!/display:none|visibility:hidden/.test(rule), 'the content left the document');
});

test('undoes the tracking correction for the scripts whose letters join', () => {
  const guard = normalized.split(`${ui}:lang(ar),`)[1] ?? '';
  assert.ok(guard.startsWith(`${ui}:lang(fa),${ui}:lang(ur){letter-spacing:normal`));
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
