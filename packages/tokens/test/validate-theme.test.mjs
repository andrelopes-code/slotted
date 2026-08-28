import assert from 'node:assert/strict';
import test from 'node:test';

import { validateTheme } from '../src/validate-theme.mjs';

const contract = {
  base: ['--base'],
  scheme: ['--scheme'],
  density: ['--density'],
  requiredSchemes: ['light', 'dark'],
  requiredDensities: ['comfortable', 'compact'],
};

const validTheme = {
  name: 'test',
  base: { '--base': '1px' },
  schemes: {
    light: { '--scheme': '#fff' },
    dark: { '--scheme': '#000' },
  },
  densities: {
    comfortable: { '--density': '2rem' },
    compact: { '--density': '1.5rem' },
  },
};

test('accepts a complete theme', () => {
  assert.deepEqual(validateTheme(contract, validTheme), []);
});

test('reports missing tokens with their scope', () => {
  const invalid = structuredClone(validTheme);
  delete invalid.schemes.dark['--scheme'];
  assert.deepEqual(validateTheme(contract, invalid), ['scheme dark is missing --scheme']);
});

test('reports unknown tokens', () => {
  const invalid = structuredClone(validTheme);
  invalid.base['--unknown'] = 'value';
  assert.deepEqual(validateTheme(contract, invalid), ['base contains unknown token --unknown']);
});
