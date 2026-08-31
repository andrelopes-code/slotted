import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(
  readFileSync(new URL('../../../../specs/components/tabs/contract.json', import.meta.url), 'utf8'),
);
const css = readFileSync(new URL('./tabs.css', import.meta.url), 'utf8');
const normalized = css.replace(/\s+/g, '');

test('lives in the component layer and styles every part', () => {
  assert.match(css, /@layer slotted\.components/);
  for (const part of ['list', 'tab', 'panel']) {
    assert.ok(normalized.includes(`[data-part='${part}']`), `Missing part ${part}`);
  }
});

test('styles both orientations and every declared state', () => {
  for (const orientation of contract.orientations) {
    assert.ok(
      normalized.includes(`[data-orientation='${orientation}']`) || orientation === 'horizontal',
      `Missing orientation ${orientation}`,
    );
  }
  for (const attribute of Object.values(contract.stateAttributes)) {
    assert.ok(normalized.includes(`[${attribute}]`), `Missing ${attribute}`);
  }
  assert.ok(normalized.includes(':focus-visible'), 'Missing focus ring');
});

test('keeps the selected tab out of the generic hover selector', () => {
  const hover = css.match(/\[data-part='tab'\]:hover[^{]*\{/)?.[0];
  assert.ok(hover, 'Missing hover rule');
  assert.match(hover.replace(/\s+/g, ''), /:not\(\[data-selected\]\)/);
});

test('documents exactly the public custom properties the stylesheet reads', () => {
  const declared = JSON.parse(readFileSync(new URL('./tabs.tokens.json', import.meta.url), 'utf8'));
  const referenced = [
    ...new Set([...css.matchAll(/var\((--slotted-[a-z0-9-]+)/g)].map(([, token]) => token)),
  ].sort();
  assert.deepEqual(declared, referenced);
});
