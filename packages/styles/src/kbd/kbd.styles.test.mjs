import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(
  readFileSync(new URL('../../../../specs/components/kbd/contract.json', import.meta.url), 'utf8'),
);
const css = readFileSync(new URL('./kbd.css', import.meta.url), 'utf8');
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations.replace(/\s+/g, '');

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('sizes every axis value the contract names', () => {
  for (const size of contract.axes.size) {
    assert.ok(normalized.includes(`.slotted-kbd[data-size='${size}']`), `Missing size ${size}`);
  }
});

test('keeps a single key at least as wide as it is tall', () => {
  for (const size of contract.axes.size) {
    const rule = normalized.split(`.slotted-kbd[data-size='${size}']{`)[1]?.split('}')[0] ?? '';
    const height = /min-block-size:var\((--[a-z0-9-]+)/.exec(rule)?.[1];
    const width = /min-inline-size:var\((--[a-z0-9-]+)/.exec(rule)?.[1];
    assert.equal(width, height, `${size} should read one token for both minimums`);
  }
});

test('sets a monospace family, so W and I take the same room', () => {
  assert.ok(normalized.includes('font-family:var(--slotted-kbd-font-family'), 'Missing the family');
});
