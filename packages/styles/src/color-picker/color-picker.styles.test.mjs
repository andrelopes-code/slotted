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
    new URL('../../../../specs/components/color-picker/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./color-picker.css', import.meta.url), 'utf8');
const fragment = withoutSelectorKeys(
  readFileSync(new URL('./color-picker.harness.html', import.meta.url), 'utf8'),
);
const normalized = css
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,:>])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const parts = [
  ...contract.members.colorPicker.parts,
  ...contract.members.colorField.parts.filter((part) => part === 'trigger'),
];

test('lives in the component layer and is keyed on the identifier', () => {
  assert.match(css, /@layer slotted\.components/);
  assert.ok(normalized.includes('[data-ui-color-picker][data-part-root]{'));
});

test('styles every drawn part and renders each in a scene', () => {
  for (const part of parts) {
    /* The text of the value is `text-field`'s input, drawn by that family. */
    if (part === 'root' || part === 'input') continue;
    assert.ok(normalized.includes(`[data-part-${part.toLowerCase()}]`), `no rule reaches ${part}`);
    assert.match(fragment, new RegExp(`data-part="${part}"`), `${part} is in no scene`);
  }
});

/**
 * The hue channel is one gradient the browser interpolates the long way round
 * the hue circle, not seven stops written by hand.
 */
test('draws the hue channel by interpolating along the hue circle', () => {
  assert.match(
    normalized,
    /linear-gradient\(to right in hsl longer hue,hsl\(0 100% 50%\),hsl\(0 100% 50%\)\)/,
  );
});

/** A thumb at either end of a channel still sits on the colour it names. */
test('keeps a channel thumb inside its track', () => {
  assert.match(
    normalized,
    /inset-inline-start:calc\(var\(--_thumb\) \/ 2 \+ var\(--_hue\) \/ 360 \* \(100% - var\(--_thumb\)\)\)/,
  );
});

/** The level is a word in a badge, never colour alone. */
test('says the contrast level in words as well as in tone', () => {
  for (const level of contract.contrast.levels) {
    assert.match(fragment, new RegExp(`data-level="${level}"`), `${level} is in no scene`);
  }
});

test('marks a colour outside sRGB on the page', () => {
  assert.match(fragment, /data-out-of-gamut/);
});

/**
 * A mark beside words is centred on the band the letters occupy, not on the
 * line box, which keeps room for descenders and drops the mark below the
 * letters (docs/build-briefing.md, _A mark beside a line of text is aligned to
 * the text_). Measured in Chrome: the chevron's centre and the letters' band
 * agree to 0.00 px.
 */
test('centres the mark of a worded button on the letters, not on the line box', () => {
  const flat = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
  assert.match(flat, /align-items: baseline;/);
  assert.match(
    flat,
    /margin-block-start: calc\(\(1cap \+ 1ex\) \/ 4 - var\(--_icon-size\) \/ 2\);/,
  );
  assert.match(flat, /translate: 0 calc\(var\(--_icon-size\) \/ 2 - \(1cap \+ 1ex\) \/ 4\);/);
});
