import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/file-upload/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./file-upload.css', import.meta.url), 'utf8');
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations.replace(/\s+/g, '');
const collapsed = declarations.replace(/\s+/g, ' ');

const rule = (selector) => collapsed.split(`${selector} {`)[1]?.split('}')[0];

test('lives in the component layer and styles every part', () => {
  assert.match(css, /@layer slotted\.components/);
  for (const part of ['dropzone', 'input', 'list', 'item']) {
    assert.ok(normalized.includes(`[data-part='${part}']`), `Missing part ${part}`);
  }
});

test('hides the control from sight and from nothing else', () => {
  assert.equal(contract.hidden, 'visually');
  const input = rule("[data-part='input']");
  assert.ok(input?.includes('clip-path: inset(50%)'), 'The clip technique is what keeps it here');
  for (const removal of ['display: none', 'visibility: hidden']) {
    assert.ok(
      !input?.includes(removal),
      `${removal} takes the control out of the tab order, which is the reason the label pairing exists`,
    );
  }
});

test('draws the ring on the region, for the control focused inside it', () => {
  assert.equal(contract.focusRing, 'fileUploadDropzone');
  assert.ok(
    normalized.includes("[data-part='dropzone']:has(:focus-visible)"),
    'A ring around a one-pixel input is a ring around nothing',
  );
  assert.ok(
    !normalized.includes("[data-part='input']:focus-visible{"),
    'The input is invisible, so it is not the element that shows focus',
  );
});

test('answers every state the region declares', () => {
  const selectors = {
    hover: "[data-part='dropzone']:hover",
    'focus-visible': "[data-part='dropzone']:has(:focus-visible)",
    disabled: "[data-part='dropzone'][data-disabled]",
    dragging: "[data-part='dropzone'][data-dragging]",
  };
  for (const state of contract.members.fileUploadDropzone.states) {
    if (state === 'default') continue;
    assert.ok(normalized.includes(selectors[state]), `Missing dropzone state ${state}`);
  }
});

test('names the drag with the attribute the shared vocabulary gives it', () => {
  assert.equal(contract.stateAttributes.dragging, 'data-dragging');
  assert.ok(normalized.includes('[data-dragging]'));
});

test('strips the list of the marker and the indent a bare ul would carry', () => {
  const list = rule("[data-part='list']");
  assert.ok(list?.includes('list-style: none'));
  assert.ok(list?.includes('padding: 0'), 'A ul indents its items by default');
});

test('reads a token in every declaration that carries a theme decision', () => {
  const themed = [
    '--slotted-file-upload-color',
    '--slotted-file-upload-gap',
    '--slotted-file-upload-dropzone-background',
    '--slotted-file-upload-dropzone-border-color',
    '--slotted-file-upload-dropzone-border-style',
    '--slotted-file-upload-dropzone-radius',
    '--slotted-file-upload-dropzone-min-block-size',
    '--slotted-file-upload-dropzone-dragging-background',
    '--slotted-file-upload-list-gap',
    '--slotted-file-upload-item-border-color',
    '--slotted-file-upload-item-gap',
  ];
  for (const token of themed) {
    assert.ok(normalized.includes(token), `Missing token ${token}`);
  }
});
