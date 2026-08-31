import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/toolbar/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./toolbar.css', import.meta.url), 'utf8');
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations.replace(/\s+/g, '');
const collapsed = declarations.replace(/\s+/g, ' ');

test('lives in the component layer', () => {
  assert.match(css, /@layer slotted\.components/);
});

test('answers both orientations the contract names', () => {
  for (const orientation of contract.orientations) {
    assert.ok(
      normalized.includes(`.slotted-toolbar[data-orientation='${orientation}']`),
      `Missing orientation ${orientation}`,
    );
  }
});

test('sizes a divider placed inside it, on either axis', () => {
  assert.ok(
    collapsed.includes(".slotted-toolbar[data-orientation='horizontal'] > .slotted-divider {"),
    'A vertical rule between groups needs a length',
  );
  assert.ok(
    collapsed.includes(".slotted-toolbar[data-orientation='vertical'] > .slotted-divider {"),
    'And so does a horizontal one',
  );
});

test('styles no control of its own, because the controls are the consumer’s', () => {
  assert.equal(contract.items, 'focusable-children');
  assert.ok(
    !normalized.includes("[data-part='item']"),
    'A toolbar that styled its items would be deciding what they are',
  );
});
