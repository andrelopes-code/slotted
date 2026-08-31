import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const contract = JSON.parse(
  readFileSync(
    new URL('../../../../specs/components/stepper/contract.json', import.meta.url),
    'utf8',
  ),
);
const css = readFileSync(new URL('./stepper.css', import.meta.url), 'utf8');
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '');
const normalized = declarations.replace(/\s+/g, '');
const collapsed = declarations.replace(/\s+/g, ' ');

test('lives in the component layer and styles every part', () => {
  assert.match(css, /@layer slotted\.components/);
  for (const member of Object.values(contract.members)) {
    for (const part of member.parts) {
      if (part === 'root') continue;
      assert.ok(normalized.includes(`[data-part='${part}']`), `Missing part ${part}`);
    }
  }
});

test('answers every orientation and every status the contract names', () => {
  for (const orientation of contract.orientations) {
    assert.ok(
      normalized.includes(`.slotted-stepper[data-orientation='${orientation}']`),
      `Missing orientation ${orientation}`,
    );
  }
  for (const status of contract.axes.status) {
    const styled =
      status === 'upcoming'
        ? collapsed.includes(".slotted-stepper [data-part='marker'] {")
        : normalized.includes(`[data-status='${status}']`);
    assert.ok(styled, `Missing status ${status}: upcoming is the marker's own rule`);
  }
});

test('tells current from complete by more than colour', () => {
  const current = normalized
    .split("[data-status='current'][data-part='marker']{")[1]
    ?.split('}')[0];
  assert.ok(
    current?.includes('border-width:'),
    'A ring the reader can see without distinguishing two tones',
  );
});

test('draws the connector, rather than leaving it to be written and hidden', () => {
  assert.equal(contract.connector, 'stylesheet');
  assert.ok(
    normalized.includes("[data-part='step']+[data-part='step']::before"),
    'Only a step after another gets a connector',
  );
});

test('runs the connector along the axis the steps are arranged on', () => {
  const horizontal = collapsed
    .split(
      ".slotted-stepper[data-orientation='horizontal'] [data-part='step'] + [data-part='step']::before {",
    )[1]
    ?.split('}')[0];
  const vertical = collapsed
    .split(
      ".slotted-stepper[data-orientation='vertical'] [data-part='step'] + [data-part='step']::before {",
    )[1]
    ?.split('}')[0];

  assert.ok(horizontal?.includes('block-size:'), 'A row of steps is joined by a thin wide line');
  assert.ok(vertical?.includes('inline-size:'), 'A column of steps is joined by a thin tall line');
  assert.ok(
    vertical?.includes('margin-inline-start: calc(var(--_marker-size) / 2)'),
    'The vertical connector should line up under the middle of the marker',
  );
});

test('clears the list styling the user agent puts on an ol', () => {
  const root = normalized.split('.slotted-stepper{')[1]?.split('}')[0] ?? '';
  assert.ok(root.includes('list-style:none'), 'The markers would read as a list of numbers');
  assert.ok(root.includes('padding:0'), 'The default indent has nothing to do with a stepper');
});
