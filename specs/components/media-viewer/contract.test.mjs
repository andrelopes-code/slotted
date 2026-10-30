import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const member = contract.members.mediaViewer;
const keyed = (key) => contract.keyboard.find((entry) => entry.key === key);

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('names the identifier a consumer selects the family by', () => {
  assert.equal(contract.family, 'media-viewer');
  assert.equal(contract.ui, 'media-viewer');
});

/**
 * The layer is dialog's: the family composes it and redraws none of it, as
 * command-palette does, and it is the one viewer of the library — upload's own
 * viewer moves onto it.
 */
test('composes dialog for the layer and reaches for none of its modules', () => {
  assert.equal(contract.layerPattern, 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/');
  assert.ok(contract.composes.includes('dialog'));
  for (const module of ['portal', 'presence', 'dismissable-layer', 'focus']) {
    assert.ok(!contract.composes.includes(module), `${module} is dialog's to compose`);
  }
  assert.equal(contract.dialog.fullScreen, 'always');
  assert.equal(contract.dialog.surface, 'plain');
});

test('holds the open state, the current item and the view as controlled pairs', () => {
  assert.deepEqual(
    member.capabilities.filter((c) => ['open', 'value', 'zoom'].includes(c)),
    ['open', 'value', 'zoom'],
  );
  assert.equal(contract.stateModel.value.controlled, 'value');
  assert.ok(contract.stateModel.value.reasons.includes('remove'));
  assert.equal(contract.stateModel.zoom.zoom.request, 'onZoomChange');
  assert.equal(contract.stateModel.zoom.rotation.request, 'onRotationChange');
  for (const model of [contract.stateModel.zoom.zoom, contract.stateModel.zoom.rotation]) {
    assert.ok(model.reasons.includes('select'), 'a step to another item resets the view');
  }
  assert.ok(contract.stateModel.open.reasons.includes('outsidePress'));
});

/** The level is a multiple of the fit, and the fit never enlarges a picture past its pixels. */
test('measures zoom from the fit, between one and four, a quarter at a time', () => {
  assert.equal(member.defaults.minZoom, 1);
  assert.equal(member.defaults.maxZoom, 4);
  assert.equal(member.defaults.zoomStep, 0.25);
  assert.match(contract.view.fit, /never above the picture's own size/);
  assert.equal(contract.view.wheel.pixelsPerStep, 100);
  assert.equal(contract.view.wheel.lineHeight, 16);
});

test('draws each kind with the platform, and runs no file it did not write', () => {
  assert.deepEqual(Object.keys(contract.kinds), [
    'image/*',
    'application/pdf',
    'text/*',
    'video/*',
    'audio/*',
    'other',
  ]);
  assert.equal(contract.kinds['image/*'].zoom, true);
  for (const kind of ['application/pdf', 'text/*', 'video/*', 'audio/*', 'other']) {
    assert.equal(contract.kinds[kind].zoom, false, `${kind} has no zoom of the viewer`);
  }
  assert.equal(contract.kinds['text/*'].element, 'pre', 'text is drawn as text, never executed');
  assert.equal(
    contract.kinds['application/pdf'].sandbox,
    false,
    "Chrome's reader refuses a sandbox",
  );
  assert.match(contract.kindsByName, /\.json/);
});

/** The two empty answers are one anatomy: a tile, a heading, a sentence, the actions. */
test('answers a file it cannot draw and a file that failed with one anatomy', () => {
  for (const part of ['tile', 'retry', 'text']) assert.ok(member.parts.includes(part), part);
  assert.match(contract.fallback, /retry/);
  assert.match(contract.fallback, /download/);
});

test('steps with the arrows only while the picture fits, and mirrors them in rtl', () => {
  assert.match(keyed('ArrowRight').when, /fit/);
  assert.match(keyed('ArrowRight').effect, /next/);
  assert.match(keyed('Arrows').when, /zoomed/);
  assert.match(keyed('Arrows').effect, /pan/);
  for (const key of ['Home', 'End', '+', '-', '0', 'r', 'Escape']) {
    assert.ok(keyed(key), `${key} is in the keyboard table`);
  }
  assert.match(contract.direction.rtl, /ArrowLeft.*next/);
});

test('declares every part the anatomy draws, with a root', () => {
  for (const part of [
    'root',
    'bar',
    'close',
    'heading',
    'title',
    'position',
    'actions',
    'download',
    'stage',
    'frame',
    'media',
    'unsupported',
    'status',
    'previous',
    'next',
    'zoom',
    'zoom-out',
    'zoom-level',
    'zoom-in',
    'fit',
    'rotate',
    'caption',
    'thumbnails',
    'thumbnail',
  ]) {
    assert.ok(member.parts.includes(part), `${part} is a part`);
  }
});

test('writes every word it says from the catalog', () => {
  for (const key of [
    'close',
    'previous',
    'next',
    'zoomIn',
    'zoomOut',
    'fit',
    'rotate',
    'download',
    'position',
    'zoomLevel',
    'unsupported',
    'error',
    'errorTitle',
    'unsupportedTitle',
    'retry',
    'truncated',
    'loading',
    'announce',
  ]) {
    assert.ok(contract.messages.includes(key), `${key} is a message`);
  }
});
