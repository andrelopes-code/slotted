import assert from 'node:assert/strict';
import test from 'node:test';

import { LAYERS, layerViolations } from './verify-layers.mjs';

const dependency = (name, kind = 'dependencies') => ({ name, kind });

test('assigns every workspace package to a layer', () => {
  assert.deepEqual(LAYERS, {
    '@slotted/tokens': 10,
    '@slotted/styles': 10,
    '@slotted/theme-default': 11,
    '@slotted/core': 20,
    '@slotted/react': 30,
    '@slotted/angular': 30,
    '@slotted/testing': 40,
    '@slotted/storybook-workbench': 40,
  });
});

test('allows a package to depend on a lower layer', () => {
  assert.deepEqual(
    layerViolations([
      { name: '@slotted/react', dependencies: [dependency('@slotted/styles', 'devDependencies')] },
    ]),
    [],
  );
});

test('rejects a dependency on the same layer, whatever its kind', () => {
  assert.deepEqual(
    layerViolations([
      { name: '@slotted/react', dependencies: [dependency('@slotted/angular', 'devDependencies')] },
    ]),
    ['@slotted/react (rank 30) must not depend on @slotted/angular (rank 30)'],
  );
});

test('rejects a dependency on a higher layer', () => {
  assert.deepEqual(
    layerViolations([{ name: '@slotted/core', dependencies: [dependency('@slotted/react')] }]),
    ['@slotted/core (rank 20) must not depend on @slotted/react (rank 30)'],
  );
});

test('permits layer 4 tooling as a development dependency', () => {
  assert.deepEqual(
    layerViolations([
      {
        name: '@slotted/react',
        dependencies: [dependency('@slotted/storybook-workbench', 'devDependencies')],
      },
    ]),
    [],
  );
});

test('rejects layer 4 tooling as a shipped dependency', () => {
  assert.deepEqual(
    layerViolations([
      {
        name: '@slotted/react',
        dependencies: [dependency('@slotted/storybook-workbench', 'dependencies')],
      },
    ]),
    ['@slotted/react (rank 30) must not depend on @slotted/storybook-workbench (rank 40)'],
  );
});

test('ignores packages outside the layer map, such as apps', () => {
  assert.deepEqual(
    layerViolations([
      { name: '@slotted/storybook-react', dependencies: [dependency('@slotted/react')] },
    ]),
    [],
  );
});

test('allows a theme to depend on the token contract inside layer 1', () => {
  assert.deepEqual(
    layerViolations([
      { name: '@slotted/theme-default', dependencies: [dependency('@slotted/tokens')] },
    ]),
    [],
  );
});

test('rejects the token contract depending on a theme', () => {
  assert.deepEqual(
    layerViolations([
      { name: '@slotted/tokens', dependencies: [dependency('@slotted/theme-default')] },
    ]),
    ['@slotted/tokens (rank 10) must not depend on @slotted/theme-default (rank 11)'],
  );
});

test('ignores dependencies outside the layer map, such as react', () => {
  assert.deepEqual(
    layerViolations([{ name: '@slotted/core', dependencies: [dependency('react')] }]),
    [],
  );
});
