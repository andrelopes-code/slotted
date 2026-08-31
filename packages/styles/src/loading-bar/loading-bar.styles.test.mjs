import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/loading-bar/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./loading-bar.css', import.meta.url), 'utf8');
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations.replace(/\s+/g, '');

test('lives in the component layer and styles the indicator part', () => {
  assert.match(css, /@layer slotted\.components/);
  assert.ok(normalized.includes("[data-part='indicator']"), 'Missing the indicator part');
});

test('answers every placement the contract names', () => {
  for (const placement of contract.axes.placement) {
    const styled =
      placement === 'inline'
        ? normalized.includes('.slotted-loading-bar{')
        : normalized.includes(`.slotted-loading-bar[data-placement='${placement}']`);
    assert.ok(styled, `Missing placement ${placement}`);
  }
});

test('spans the fixed bar with a logical inset', () => {
  assert.ok(
    normalized.includes('inset-inline:0'),
    'Two physical offsets would need a second rule for a right-to-left document',
  );
  assert.ok(normalized.includes('position:fixed'), 'The page-level bar leaves the flow');
});

test('leaves the track unpainted, so a page-level bar is a line and not a band', () => {
  assert.ok(
    normalized.includes('background-color:var(--slotted-loading-bar-track-color,transparent)'),
    'A track behind a page-level bar reads as a permanent rule under the header',
  );
});

test('states every state the contract declares', () => {
  for (const attribute of Object.values(contract.stateAttributes)) {
    assert.ok(normalized.includes(`[${attribute}]`), `Missing ${attribute}`);
  }
});
