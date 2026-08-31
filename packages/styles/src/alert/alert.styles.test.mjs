import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/alert/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./alert.css', import.meta.url), 'utf8');
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations.replace(/\s+/g, '');

test('lives in the component layer and styles every part', () => {
  assert.match(css, /@layer slotted\.components/);
  for (const member of Object.values(contract.members)) {
    for (const part of member.parts) {
      if (part === 'root') continue;
      assert.ok(normalized.includes(`[data-part='${part}']`), `Missing part ${part}`);
    }
  }
});

test('answers every value of every axis the contract names', () => {
  for (const [axis, values] of Object.entries(contract.axes)) {
    for (const value of values) {
      assert.ok(
        normalized.includes(`.slotted-alert[data-${axis}='${value}']`),
        `Missing ${axis} ${value}`,
      );
    }
  }
});

test('routes every variant through the same five local properties', () => {
  for (const variant of contract.axes.variant) {
    const rule = normalized.split(`.slotted-alert[data-variant='${variant}']{`)[1]?.split('}')[0];
    assert.ok(rule, `Missing variant ${variant}`);
    for (const local of ['--_solid:', '--_on-solid:', '--_border:', '--_surface:', '--_text:']) {
      assert.ok(rule.includes(local), `Variant ${variant} does not set ${local}`);
    }
  }
});

test('places every region by grid area, so a missing one collapses', () => {
  for (const area of ['icon', 'title', 'description', 'actions']) {
    assert.ok(normalized.includes(`grid-area:${area}`), `Missing grid area ${area}`);
  }
  assert.ok(
    normalized.includes("grid-template-areas:'icontitleactions''icondescriptionactions'"),
    'The icon should span both rows and the actions column should stay at the end',
  );
});

test('keeps a border under forced colours, where the tone is discarded', () => {
  assert.ok(
    /@media\(forced-colors:active\)\{\.slotted-alert\{border-color:currentColor/.test(normalized),
    'A subtle alert would otherwise be one flat rectangle',
  );
});
