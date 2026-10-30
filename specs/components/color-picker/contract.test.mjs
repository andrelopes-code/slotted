import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const picker = contract.members.colorPicker;
const field = contract.members.colorField;

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

/**
 * Two members under one identifier: the panel, inline or inside a popover,
 * and the field that opens it — a text field whose start is the swatch
 *.
 */
test('ships the panel and the field that opens it', () => {
  assert.equal(contract.ui, 'color-picker');
  assert.deepEqual(Object.keys(contract.members), ['colorPicker', 'colorField']);
  assert.deepEqual(contract.composes, ['text-field', 'popover']);
  assert.deepEqual(field.parts, ['root', 'input', 'trigger', 'content']);
});

test('draws an area, two channels, a preview, the text, presets and the contrast', () => {
  for (const part of ['area', 'area-thumb', 'channel', 'channel-thumb', 'swatch', 'previous']) {
    assert.ok(picker.parts.includes(part), part);
  }
  for (const part of ['input', 'format', 'eyedropper', 'presets', 'preset', 'contrast', 'gamut']) {
    assert.ok(picker.parts.includes(part), part);
  }
});

/**
 * The value is a string in the format the consumer chose, so what comes in is
 * what goes out; the colour arithmetic lives in one core module.
 */
test('holds a string in the current format and converts nothing in a binding', () => {
  assert.deepEqual(contract.formats, ['hex', 'rgb', 'hsl', 'oklch']);
  assert.ok(contract.core.includes('@slotted/core/color'));
  assert.deepEqual(contract.stateModel.value.reasons, [
    'pointer',
    'keyboard',
    'select',
    'programmatic',
  ]);
  assert.deepEqual(contract.stateModel.format, {
    controlled: 'format',
    uncontrolled: 'defaultFormat',
    request: 'onFormatChange',
    reasons: ['select'],
  });
  assert.deepEqual(contract.resolution.format, ['prop', 'value', 'defaults', 'hex']);
});

/** A colour outside sRGB is said, never quietly clipped. */
test('declares a value outside sRGB instead of converting it', () => {
  assert.equal(contract.gamut.space, 'srgb');
  assert.equal(contract.gamut.attribute, 'data-out-of-gamut');
  assert.ok(picker.parts.includes('gamut'));
});

test('measures the contrast against a colour the consumer names', () => {
  assert.equal(contract.contrast.against, 'contrastWith');
  assert.deepEqual(contract.contrast.levels, ['AAA', 'AA', 'AA-large', 'fail']);
});

test('moves every channel with the slider keys and the area in two dimensions', () => {
  const keys = contract.keyboard.map(({ key }) => key);
  assert.ok(keys.includes('Home / End'));
  assert.ok(keys.includes('Shift+Arrow, PageUp / PageDown'));
  assert.equal(contract.escapeBound, false);
});

test('declares one scenario per demonstration the reference page owes', () => {
  assert.deepEqual(contract.scenarios.colorPicker, [
    'playground',
    'field',
    'panel',
    'formats',
    'alpha',
    'presets',
    'contrast',
    'states',
    'composition',
    'keyboard',
  ]);
});
