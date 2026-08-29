import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const theme = JSON.parse(readFileSync(new URL('../src/theme.json', import.meta.url), 'utf8'));
const tones = ['neutral', 'accent', 'success', 'warning', 'danger'];
const solidStates = ['solid', 'solid-hover', 'solid-active'];

function channel(value) {
  const normalized = value / 255;
  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const match = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
  assert.ok(match, `Expected a literal six-digit hex color, received ${hex}`);
  const [, red = '00', green = '00', blue = '00'] = match;
  return (
    0.2126 * channel(Number.parseInt(red, 16)) +
    0.7152 * channel(Number.parseInt(green, 16)) +
    0.0722 * channel(Number.parseInt(blue, 16))
  );
}

function contrast(first, second) {
  const high = Math.max(luminance(first), luminance(second));
  const low = Math.min(luminance(first), luminance(second));
  return (high + 0.05) / (low + 0.05);
}

for (const [scheme, values] of Object.entries(theme.schemes)) {
  test(`${scheme} solid tones meet text contrast`, () => {
    for (const tone of tones) {
      const foreground = values[`--slotted-tone-${tone}-on-solid`];
      for (const state of solidStates) {
        const background = values[`--slotted-tone-${tone}-${state}`];
        assert.ok(
          contrast(background, foreground) >= 4.5,
          `${scheme}.${tone}.${state} has insufficient contrast`,
        );
      }
    }
  });
}

test('danger remains a strong surface with white text', () => {
  for (const values of Object.values(theme.schemes)) {
    assert.equal(values['--slotted-tone-danger-on-solid'], '#ffffff');
  }
});
