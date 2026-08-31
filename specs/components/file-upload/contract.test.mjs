import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('holds the region, the control, and the list of what was chosen', () => {
  assert.equal(contract.family, 'file-upload');
  assert.deepEqual(Object.keys(contract.members), [
    'fileUpload',
    'fileUploadDropzone',
    'fileUploadInput',
    'fileUploadList',
    'fileUploadItem',
  ]);
});

test('gives each member its native element and part', () => {
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(contract.members).map(([name, member]) => [name, member.nativeElement]),
    ),
    {
      fileUpload: 'div',
      fileUploadDropzone: 'label',
      fileUploadInput: 'input',
      fileUploadList: 'ul',
      fileUploadItem: 'li',
    },
  );
  assert.deepEqual(
    Object.entries(contract.members).map(([, member]) => member.parts),
    [['root'], ['dropzone'], ['input'], ['list'], ['item']],
  );
});

test('makes the native input the control and the region its label', () => {
  assert.equal(contract.control, 'fileUploadInput');
  assert.equal(
    contract.labelledBy,
    'fileUploadDropzone',
    'A label names the control it contains, so no id is generated',
  );
  assert.equal(contract.inputType, 'file');
});

test('keeps the control focusable while removing it from sight', () => {
  assert.equal(
    contract.hidden,
    'visually',
    'display:none would take the control out of the tab order, which is the reason the label pairing exists',
  );
});

test('draws the focus ring on the region, for the control inside it', () => {
  assert.deepEqual(contract.members.fileUploadDropzone.states, [
    'default',
    'hover',
    'focus-visible',
    'disabled',
    'dragging',
  ]);
  assert.equal(contract.focusRing, 'fileUploadDropzone');
});

test('announces what arrived, because a drop is otherwise silent', () => {
  assert.equal(contract.liveRegion, 'fileUploadList');
});

test('names a state attribute for the drag, and for nothing that is not a state', () => {
  assert.deepEqual(contract.stateAttributes, {
    disabled: 'data-disabled',
    dragging: 'data-dragging',
  });
});

test('validates what a drop delivers, since accept only filters the picker', () => {
  assert.deepEqual(contract.members.fileUpload.capabilities, ['files', 'disabled']);
  assert.deepEqual(contract.rejectionReasons, ['type', 'size', 'multiple']);
});

test('defaults to one file at a time, with no limit on its type or size', () => {
  assert.deepEqual(contract.members.fileUpload.defaults, { multiple: false });
});

test('leaves the row nothing to configure: the library never uploads', () => {
  assert.deepEqual(contract.members.fileUploadItem.capabilities, ['wiring']);
  assert.deepEqual(contract.members.fileUploadItem.defaults, {});
  assert.deepEqual(contract.members.fileUploadList.capabilities, ['wiring']);
});

test('names one scenario page for the family', () => {
  assert.deepEqual(Object.keys(contract.scenarios), ['fileUpload']);
  assert.deepEqual(contract.scenarios.fileUpload, [
    'playground',
    'validation',
    'progress',
    'accessibility',
  ]);
});
