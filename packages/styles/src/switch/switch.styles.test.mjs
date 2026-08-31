import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/switch/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./switch.css', import.meta.url), 'utf8');
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations.replace(/\s+/g, '');
const collapsed = declarations.replace(/\s+/g, ' ');

const rule = (selector) => collapsed.split(`${selector} {`)[1]?.split('}')[0];

test('lives in the component layer and styles every part', () => {
  assert.match(css, /@layer slotted\.components/);
  assert.deepEqual(contract.members.switch.parts, ['root', 'thumb']);
  assert.ok(normalized.includes('.slotted-switch{'));
  assert.ok(normalized.includes("[data-part='thumb']"), 'Missing part thumb');
});

test('answers every size the contract names, on the track and on the thumb', () => {
  for (const size of contract.axes.size) {
    assert.ok(normalized.includes(`.slotted-switch[data-size='${size}']{`), `Missing ${size}`);
    assert.ok(
      normalized.includes(`.slotted-switch[data-size='${size}'][data-part='thumb']`),
      `Missing thumb size ${size}`,
    );
  }
});

test('answers every state the contract declares, on the control itself', () => {
  assert.equal(contract.mirrorsState, true);
  for (const state of contract.members.switch.states) {
    if (state === 'default') continue;
    const selector = contract.stateAttributes[state]
      ? `.slotted-switch[${contract.stateAttributes[state]}]`
      : `.slotted-switch:${state}`;
    assert.ok(normalized.includes(selector), `Missing state ${state}`);
  }
});

test('never reaches for the field', () => {
  assert.ok(!normalized.includes('.slotted-field'));
});

test('moves the thumb with a logical margin, not with a translation', () => {
  const thumb = rule(".slotted-switch [data-part='thumb']");
  assert.ok(thumb?.includes('margin-inline-start: 0'), 'The thumb starts at the inline start');
  assert.ok(
    !normalized.includes('transform:translate'),
    'A translation moves along the physical axis and needs a second rule for right-to-left',
  );
  assert.ok(
    rule(".slotted-switch[data-checked] [data-part='thumb']")?.includes(
      'margin-inline-start: auto',
    ),
    'The travel is whatever the track has left, so a theme cannot push the thumb outside it',
  );
});

test('sizes the track in the inline axis alone, and lets the padding set the rest', () => {
  for (const size of contract.axes.size) {
    const track = rule(`.slotted-switch[data-size='${size}']`);
    assert.ok(track?.includes('inline-size:'), `Missing inline size for ${size}`);
    assert.ok(!track?.includes('block-size:'), `${size} should take its block size from the thumb`);
  }
});

test('looks disabled however it was disabled, including by a fieldset', () => {
  assert.ok(
    normalized.includes('.slotted-switch[data-disabled],.slotted-switch:disabled'),
    'A disabled <fieldset> disables every control inside it without telling them, so the attribute alone leaves an inert control looking operable',
  );
});
