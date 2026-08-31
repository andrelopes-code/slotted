import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/virtual-list/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./virtual-list.css', import.meta.url), 'utf8');
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations.replace(/\s+/g, '');
const collapsed = declarations.replace(/\s+/g, ' ');

const rule = (selector) => collapsed.split(`${selector} {`)[1]?.split('}')[0];

test('lives in the component layer and styles every part', () => {
  assert.match(css, /@layer slotted\.components/);
  for (const part of ['canvas', 'item']) {
    assert.ok(normalized.includes(`[data-part='${part}']`), `Missing part ${part}`);
  }
});

test('makes the root the scroll container, in the axis the contract names', () => {
  assert.equal(contract.axis, 'block');
  const root = rule('.slotted-virtual-list');
  assert.ok(root?.includes('overflow: auto'), 'The root is the element that scrolls');
  assert.ok(
    !normalized.includes('overflow:hidden'),
    'Hiding overflow anywhere in the family would stop the list scrolling',
  );
});

test('leaves the block size to the consumer, so the viewport is theirs to set', () => {
  const root = rule('.slotted-virtual-list');
  assert.ok(
    !/(?:^|;)\s*block-size:/.test(root ?? ''),
    'A viewport height chosen by the stylesheet would be wrong on every page',
  );
});

test('draws a focus ring for the state the contract declares, and draws it inside', () => {
  for (const state of contract.members.virtualList.states) {
    if (state === 'default') continue;
    assert.ok(normalized.includes(`.slotted-virtual-list:${state}`), `Missing root state ${state}`);
  }
  const ring = rule('.slotted-virtual-list:focus-visible');
  assert.ok(
    ring?.includes('outline-offset: calc(var(--slotted-focus-ring-offset, 2px) * -1)'),
    'A ring offset outwards from a scrolling region is clipped by the first ancestor that hides its overflow',
  );
});

test('positions rows against the canvas, not against the scrolling root', () => {
  assert.ok(rule("[data-part='canvas']")?.includes('position: relative'));
  assert.ok(rule("[data-part='item']")?.includes('position: absolute'));
});

test('writes no arithmetic the component owns', () => {
  for (const property of ['inset-block-start', 'block-size']) {
    assert.ok(
      !new RegExp(`(?:^|[;{}\\s])${property}\\s*:`).test(declarations),
      `${property} is derived from itemCount and itemSize, so the component writes it inline`,
    );
  }
});

test('reads a token in every declaration that carries a theme decision', () => {
  const themed = [
    '--slotted-virtual-list-background',
    '--slotted-virtual-list-border-color',
    '--slotted-virtual-list-radius',
    '--slotted-virtual-list-color',
    '--slotted-virtual-list-item-border-color',
    '--slotted-virtual-list-item-border-width',
    '--slotted-virtual-list-item-gap',
    '--slotted-virtual-list-item-padding-inline',
  ];
  for (const token of themed) {
    assert.ok(normalized.includes(token), `Missing token ${token}`);
  }
});
