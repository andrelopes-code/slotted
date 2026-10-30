import assert from 'node:assert/strict';
import test from 'node:test';

import { parseSpecimenArguments, specimenStem } from './specimen.mjs';

test('reads a family page or a reference url, never both and never neither', () => {
  assert.throws(() => parseSpecimenArguments([]), /usage/);
  assert.throws(
    () => parseSpecimenArguments(['--family', 'badge', '--url', 'https://example.com']),
    /either --family or --url/,
  );
  assert.equal(parseSpecimenArguments(['--family', 'badge', '--width', '420']).family, 'badge');
  assert.equal(
    parseSpecimenArguments(['--url', 'https://example.com/x']).url,
    'https://example.com/x',
  );
});

test('a family page is read at a stage width the harness draws', () => {
  assert.throws(
    () => parseSpecimenArguments(['--family', 'badge', '--width', '640']),
    /240, 420, 720/,
  );
  assert.equal(parseSpecimenArguments(['--family', 'badge']).width, '420');
});

test('a family page is also read at a width one of its scenes declares', () => {
  assert.equal(
    parseSpecimenArguments(['--family', 'event-calendar', '--width', '1024']).width,
    '1024',
  );
  assert.throws(
    () => parseSpecimenArguments(['--family', 'badge', '--width', '1024']),
    /240, 420, 720/,
  );
});

test('a reference is an http page, read at 1280 pixels unless told otherwise', () => {
  assert.throws(() => parseSpecimenArguments(['--url', 'file:///tmp/x.html']), /http/);
  const options = parseSpecimenArguments(['--url', 'https://reui.io/preview/base/list-6']);
  assert.equal(options.width, '1280');
  assert.equal(options.name, 'reui-io-preview-base-list-6');
});

test('every axis is checked against the values the page can take', () => {
  assert.throws(() => parseSpecimenArguments(['--family', 'badge', '--motion', 'slow']), /motion/);
  assert.throws(
    () => parseSpecimenArguments(['--family', 'badge', '--forced-colors', 'on']),
    /forced-colors/,
  );
  assert.throws(() => parseSpecimenArguments(['--family', 'badge', '--limit', '0']), /limit/);
  assert.throws(() => parseSpecimenArguments(['--family', 'badge', '--nope', 'x']), /--nope/);
});

test('clicks keep their order, since a second step is reached through the first', () => {
  const options = parseSpecimenArguments([
    '--url',
    'https://example.com',
    '--click',
    '#open',
    '--click',
    '#next',
  ]);
  assert.deepEqual(options.click, ['#open', '#next']);
});

test('the stem names every axis away from its default, so runs never overwrite each other', () => {
  const base = parseSpecimenArguments(['--family', 'badge']);
  assert.equal(specimenStem(base), 'slotted-light-420');

  const moved = parseSpecimenArguments([
    '--family',
    'badge',
    '--theme',
    'dark',
    '--density',
    'dense',
    '--dir',
    'rtl',
    '--motion',
    'reduce',
    '--forced-colors',
    'active',
  ]);
  assert.equal(specimenStem(moved), 'slotted-dark-420-dense-rtl-motion-reduce-forced');
});

test('two selectors that share a long prefix still land in two files', () => {
  const stem = (states) =>
    specimenStem(parseSpecimenArguments(['--family', 'badge', '--states', states]));
  const first = stem('#row-1-title, #row-1-cancel, #row-1-toggle, #row-3-toggle');
  const second = stem('#row-1-title, #row-1-cancel, #row-1-toggle, #row-3-remove');
  assert.notEqual(first, second);
  assert.match(first, /^slotted-light-420-row-1-title-row-1-canc[a-z-]*-[0-9a-f]{6}$/);
});

test('a reference stem starts with its name and keeps the click path apart from the state selector', () => {
  const options = parseSpecimenArguments([
    '--url',
    'https://reui.io/preview/base/list-6?theme=dark',
    '--name',
    'list-6',
    '--theme',
    'dark',
    '--click',
    '[data-slot=tabs-trigger]',
    '--states',
    'button',
  ]);
  assert.match(
    specimenStem(options),
    /^list-6-dark-1280-click-data-slot-tabs-trigger-[0-9a-f]{6}-button-[0-9a-f]{6}$/,
  );
});
