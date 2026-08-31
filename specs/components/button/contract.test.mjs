import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { assertContractShape } from '../../contract.schema.mjs';

const contract = JSON.parse(await readFile(new URL('./contract.json', import.meta.url), 'utf8'));
const appearanceMembers = ['button', 'buttonLink', 'iconButton', 'toggleButton'];

test('defines the ordered button family structure and axes', () => {
  assert.equal(contract.family, 'button');
  assert.deepEqual(Object.keys(contract.members), [
    'button',
    'buttonLink',
    'iconButton',
    'toggleButton',
    'buttonGroup',
  ]);
  assert.deepEqual(contract.axes.variant, ['accent', 'secondary', 'success', 'warning', 'danger']);
  assert.deepEqual(contract.axes.fill, ['solid', 'outline', 'ghost']);
  assert.deepEqual(contract.axes.size, ['sm', 'md', 'lg']);
  assert.deepEqual(contract.orientations, ['horizontal', 'vertical']);
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(contract.members).map(([memberName, member]) => [memberName, member.parts]),
    ),
    {
      button: ['leading', 'label', 'trailing', 'loading-indicator'],
      buttonLink: ['leading', 'label', 'trailing'],
      iconButton: ['icon', 'loading-indicator'],
      toggleButton: ['leading', 'label', 'trailing'],
      buttonGroup: ['group'],
    },
  );
});

test('gives each family member valid and semantic defaults', () => {
  const expectedSemantics = {
    button: { nativeElement: 'button', type: 'button' },
    buttonLink: { nativeElement: 'a' },
    iconButton: { nativeElement: 'button', type: 'button' },
    toggleButton: { nativeElement: 'button', type: 'button', pressed: false },
    buttonGroup: { nativeElement: 'div', orientation: 'horizontal' },
  };

  for (const memberName of appearanceMembers) {
    const member = contract.members[memberName];

    for (const axis of ['variant', 'fill', 'size']) {
      assert.ok(axis in member.defaults, `${memberName} defaults include ${axis}`);
      assert.ok(contract.axes[axis].includes(member.defaults[axis]), `${memberName} ${axis}`);
    }
  }

  for (const [memberName, expected] of Object.entries(expectedSemantics)) {
    const member = contract.members[memberName];
    assert.equal(member.nativeElement, expected.nativeElement, memberName);

    if (memberName === 'buttonGroup') {
      assert.ok(contract.orientations.includes(member.defaults.orientation), memberName);
    }

    for (const [key, value] of Object.entries(expected)) {
      if (key !== 'nativeElement') {
        assert.equal(member.defaults[key], value, memberName);
      }
    }
  }
});

test('satisfies the shared contract schema', () => {
  assertContractShape(contract);
});

test('provides uniquely named scenarios for every page', () => {
  assert.deepEqual(Object.keys(contract.scenarios), [
    'overview',
    'button',
    'buttonLink',
    'iconButton',
    'toggleButton',
    'buttonGroup',
  ]);

  for (const [page, scenarioIds] of Object.entries(contract.scenarios)) {
    assert.ok(Array.isArray(scenarioIds) && scenarioIds.length > 0, page);
    assert.equal(new Set(scenarioIds).size, scenarioIds.length, page);
    for (const scenarioId of scenarioIds) {
      assert.match(scenarioId, /^[a-z][a-zA-Z]+$/, `${page}: ${scenarioId}`);
    }
  }
});
