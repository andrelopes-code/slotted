import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/avatar/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./avatar.css', import.meta.url), 'utf8');
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations.replace(/\s+/g, '');
const collapsed = declarations.replace(/\s+/g, ' ');

test('lives in the component layer and styles every part', () => {
  assert.match(css, /@layer slotted\.components/);
  for (const part of ['image', 'fallback']) {
    assert.ok(normalized.includes(`[data-part='${part}']`), `Missing part ${part}`);
  }
});

test('sizes every axis value the contract names', () => {
  for (const size of contract.axes.size) {
    assert.ok(normalized.includes(`.slotted-avatar[data-size='${size}']`), `Missing size ${size}`);
  }
});

test('shows exactly one of the two parts, whatever the state', () => {
  assert.ok(
    /\[data-part='image'\] \{[^}]*display: none/.test(collapsed),
    'The picture starts hidden, because it may never arrive',
  );
  assert.ok(
    collapsed.includes(".slotted-avatar[data-loaded] [data-part='image'] { display: block"),
    'A loaded picture is shown',
  );
  assert.ok(
    collapsed.includes(".slotted-avatar[data-loaded] [data-part='fallback'] { display: none"),
    'A loaded picture replaces the fallback rather than covering it',
  );
});

test('states the loaded state the contract declares', () => {
  for (const attribute of Object.values(contract.stateAttributes)) {
    assert.ok(normalized.includes(`[${attribute}]`), `Missing ${attribute}`);
  }
});

test('documents exactly the public custom properties the stylesheet reads', () => {
  const declared = JSON.parse(
    readFileSync(new URL('./avatar.tokens.json', import.meta.url), 'utf8'),
  );
  const referenced = [
    ...new Set([...css.matchAll(/var\((--slotted-[a-z0-9-]+)/g)].map(([, token]) => token)),
  ].sort();
  assert.deepEqual(declared, referenced);
});
