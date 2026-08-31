import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/divider/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./divider.css', import.meta.url), 'utf8');
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations.replace(/\s+/g, '');

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('sizes each orientation the contract names', () => {
  for (const orientation of contract.orientations) {
    assert.ok(
      normalized.includes(`.slotted-divider[data-orientation='${orientation}']`),
      `Missing orientation ${orientation}`,
    );
  }
});

test('removes the border the user agent draws on an hr', () => {
  assert.ok(normalized.includes('border:0'), 'The default hr border would double the rule');
});
