import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/splitter/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./splitter.css', import.meta.url), 'utf8');
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations.replace(/\s+/g, '');
const collapsed = declarations.replace(/\s+/g, ' ');

test('lives in the component layer and styles every part', () => {
  assert.match(css, /@layer slotted\.components/);
  for (const part of ['pane', 'handle']) {
    assert.ok(normalized.includes(`[data-part='${part}']`), `Missing part ${part}`);
  }
});

test('lays the root out as a grid, so the position is a track size', () => {
  const root = collapsed.split('.slotted-splitter {')[1]?.split('}')[0];
  assert.ok(root?.includes('display: grid'), 'The position is written as a grid template inline');
  assert.ok(
    !normalized.includes('grid-template-columns') && !normalized.includes('grid-template-rows'),
    'The template is the component’s to write, not the stylesheet’s',
  );
});

test('answers both orientations the contract names, with the right cursor', () => {
  for (const orientation of contract.orientations) {
    assert.ok(
      normalized.includes(`.slotted-splitter[data-orientation='${orientation}']`),
      `Missing orientation ${orientation}`,
    );
  }
  assert.ok(normalized.includes('cursor:col-resize'), 'Side-by-side panes resize horizontally');
  assert.ok(normalized.includes('cursor:row-resize'), 'Stacked panes resize vertically');
});

test('reacts to every pseudo-state the handle declares', () => {
  for (const state of contract.members.splitterHandle.states) {
    if (state === 'default') continue;
    assert.ok(
      normalized.includes(`[data-part='handle']:${state}`),
      `Missing handle state ${state}`,
    );
  }
});

test('gives the handle a pointer target larger than the line it draws', () => {
  assert.ok(
    normalized.includes("[data-part='handle']::after"),
    'A four-pixel separator is a hard target',
  );
  assert.ok(
    normalized.includes('--slotted-splitter-handle-hit-area'),
    'The larger target should be a theme decision',
  );
});

test('stops the browser from panning while the handle is dragged', () => {
  const handle = collapsed.split(".slotted-splitter [data-part='handle'] {")[1]?.split('}')[0];
  assert.ok(handle?.includes('touch-action: none'), 'A touch drag would scroll the page instead');
});
