import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/badge/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./badge.css', import.meta.url), 'utf8');
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations.replace(/\s+/g, '');

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('answers every value of every axis the contract names', () => {
  for (const [axis, values] of Object.entries(contract.axes)) {
    for (const value of values) {
      assert.ok(
        normalized.includes(`.slotted-badge[data-${axis}='${value}']`),
        `Missing ${axis} ${value}`,
      );
    }
  }
});

test('routes every variant through the same four local properties', () => {
  for (const variant of contract.axes.variant) {
    const rule = normalized.split(`.slotted-badge[data-variant='${variant}']{`)[1]?.split('}')[0];
    assert.ok(rule, `Missing variant ${variant}`);
    for (const local of ['--_solid:', '--_on-solid:', '--_border:', '--_text:']) {
      assert.ok(rule.includes(local), `Variant ${variant} does not set ${local}`);
    }
  }
});

test('keeps a border under forced colours, where the tone is discarded', () => {
  assert.ok(
    /@media\(forced-colors:active\)\{\.slotted-badge\{border-color:currentColor/.test(normalized),
    'A solid and an outline badge are otherwise indistinguishable',
  );
});
