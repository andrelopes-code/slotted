import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(
  readFileSync(new URL('../../../../specs/components/tag/contract.json', import.meta.url), 'utf8'),
);
const css = readFileSync(new URL('./tag.css', import.meta.url), 'utf8');
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations.replace(/\s+/g, '');

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('answers every value of every axis the contract names', () => {
  for (const [axis, values] of Object.entries(contract.axes)) {
    for (const value of values) {
      assert.ok(
        normalized.includes(`.slotted-tag[data-${axis}='${value}']`),
        `Missing ${axis} ${value}`,
      );
    }
  }
});

test('routes every variant through the same four local properties', () => {
  for (const variant of contract.axes.variant) {
    const rule = normalized.split(`.slotted-tag[data-variant='${variant}']{`)[1]?.split('}')[0];
    assert.ok(rule, `Missing variant ${variant}`);
    for (const local of ['--_solid:', '--_on-solid:', '--_border:', '--_surface:', '--_text:']) {
      assert.ok(rule.includes(local), `Variant ${variant} does not set ${local}`);
    }
  }
});

test('draws the remove glyph in CSS, so neither framework ships a cross', () => {
  assert.ok(
    normalized.includes("[data-part='remove']::before") &&
      normalized.includes("[data-part='remove']::after"),
    'Missing the drawn cross',
  );
  assert.ok(
    /\[data-part='remove'\]::before,\.slotted-tag\[data-part='remove'\]::after\{[^}]*inset:0;margin:auto/.test(
      normalized,
    ),
    'A percentage translation is not symmetric in a right-to-left document',
  );
});

test('reacts to every state the remove control declares', () => {
  for (const state of contract.members.tagRemove.states) {
    if (state === 'default') continue;
    const selector = state === 'disabled' ? ':disabled' : `:${state}`;
    assert.ok(
      normalized.includes(`[data-part='remove']${selector}`),
      `Missing remove state ${state}`,
    );
  }
});

test('keeps a border under forced colours, where the tone is discarded', () => {
  assert.ok(
    /@media\(forced-colors:active\)\{\.slotted-tag\{border-color:currentColor/.test(normalized),
    'A solid and an outline tag are otherwise indistinguishable',
  );
});
