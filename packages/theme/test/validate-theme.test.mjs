import assert from 'node:assert/strict';
import test from 'node:test';

import { validateTheme } from '../dist/index.js';

function token(name, overrides = {}) {
  return { name, layer: 'primitive', axis: 'base', type: 'length', root: true, ...overrides };
}

const contract = {
  layers: ['primitive', 'semantic', 'component'],
  axes: ['base', 'scheme', 'density'],
  requiredSchemes: ['light', 'dark'],
  requiredDensities: ['comfortable', 'compact'],
  tokens: [
    token('--base'),
    token('--scheme', { layer: 'semantic', axis: 'scheme', type: 'color', forcedColor: 'Canvas' }),
    token('--density', { layer: 'semantic', axis: 'density' }),
  ],
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

test('reports an unknown scheme variant', () => {
  const invalid = structuredClone(validTheme);
  invalid.schemes.typo = { '--scheme': '#f0f' };
  assert.deepEqual(validateTheme(contract, invalid), ['scheme contains unknown variant typo']);
});

test('reports an unknown density variant', () => {
  const invalid = structuredClone(validTheme);
  invalid.densities.typo = { '--density': '1rem' };
  assert.deepEqual(validateTheme(contract, invalid), ['density contains unknown variant typo']);
});

test('reports a missing required scheme variant', () => {
  const invalid = structuredClone(validTheme);
  delete invalid.schemes.dark;
  assert.deepEqual(validateTheme(contract, invalid), ['scheme is missing required variant dark']);
});

test('reports a missing required density variant', () => {
  const invalid = structuredClone(validTheme);
  delete invalid.densities.compact;
  assert.deepEqual(validateTheme(contract, invalid), [
    'density is missing required variant compact',
  ]);
});

/* ------------------------------------------------------------------ layers */

const layeredContract = {
  layers: ['primitive', 'semantic', 'component'],
  axes: ['base', 'scheme', 'density'],
  requiredSchemes: [],
  requiredDensities: [],
  tokens: [
    token('--primitive'),
    token('--semantic', { layer: 'semantic', root: false }),
    token('--component', { layer: 'component', root: false }),
  ],
};

function layeredTheme(values) {
  return { base: values, schemes: {}, densities: {} };
}

test('accepts a token that composes its value from a shallower layer', () => {
  assert.deepEqual(
    validateTheme(
      layeredContract,
      layeredTheme({
        '--primitive': '4px',
        '--semantic': 'var(--primitive)',
        '--component': 'var(--semantic)',
      }),
    ),
    [],
  );
});

test('rejects a token that reaches for a deeper layer', () => {
  assert.deepEqual(
    validateTheme(
      layeredContract,
      layeredTheme({
        '--primitive': '4px',
        '--semantic': 'var(--component)',
        '--component': 'var(--primitive)',
      }),
    ),
    ['base --semantic is semantic and reaches for component --component'],
  );
});

test('rejects a reference the contract does not declare', () => {
  assert.deepEqual(
    validateTheme(
      layeredContract,
      layeredTheme({
        '--primitive': '4px',
        '--semantic': 'var(--absent)',
        '--component': 'var(--semantic)',
      }),
    ),
    ['base --semantic references --absent, which the contract does not declare'],
  );
});

test('rejects a composed token that restates a literal without a reason', () => {
  assert.deepEqual(
    validateTheme(
      layeredContract,
      layeredTheme({ '--primitive': '4px', '--semantic': '4px', '--component': 'var(--semantic)' }),
    ),
    ['base --semantic states a literal without declaring why'],
  );
});

test('accepts a literal a token declares a reason for', () => {
  const contract = structuredClone(layeredContract);
  contract.tokens[1].literal = 'zero is the absence of tracking';
  assert.deepEqual(
    validateTheme(
      contract,
      layeredTheme({ '--primitive': '4px', '--semantic': '0', '--component': 'var(--semantic)' }),
    ),
    [],
  );
});

test('rejects a scale root that also declares a literal reason', () => {
  const contract = structuredClone(layeredContract);
  contract.tokens[1].root = true;
  contract.tokens[1].literal = 'both cannot be true';
  const errors = validateTheme(
    contract,
    layeredTheme({ '--primitive': '4px', '--semantic': '0', '--component': 'var(--semantic)' }),
  );
  assert.deepEqual(errors, ['--semantic is a scale root, so a literal reason says nothing']);
});

/* ---------------------------------------------------------- forced colors */

test('requires every scheme token to declare a forced-colors mapping', () => {
  const contract = structuredClone(validTheme.schemes ? layeredContract : layeredContract);
  contract.tokens = [token('--scheme', { layer: 'semantic', axis: 'scheme', type: 'color' })];
  const errors = validateTheme(contract, { base: {}, schemes: {}, densities: {} });
  assert.deepEqual(errors, ['--scheme varies by scheme and declares no forced-colors mapping']);
});

test('rejects a forced-colors mapping that is not a system color', () => {
  const contract = structuredClone(layeredContract);
  contract.tokens = [
    token('--scheme', { layer: 'semantic', axis: 'scheme', type: 'color', forcedColor: '#ff0000' }),
  ];
  const errors = validateTheme(contract, { base: {}, schemes: {}, densities: {} });
  assert.deepEqual(errors, ['--scheme maps to #ff0000, which is not a system color']);
});

test('rejects a forced-colors mapping on a token no scheme varies', () => {
  const contract = structuredClone(layeredContract);
  contract.tokens = [token('--base', { forcedColor: 'Canvas' })];
  const errors = validateTheme(contract, { base: {}, schemes: {}, densities: {} });
  assert.deepEqual(errors, [
    '--base does not vary by scheme, so forced colors cannot replace it',
    'base is missing --base',
  ]);
});

test('rejects a token the contract declares twice', () => {
  const contract = structuredClone(layeredContract);
  contract.tokens = [token('--primitive'), token('--primitive')];
  const errors = validateTheme(contract, layeredTheme({ '--primitive': '4px' }));
  assert.deepEqual(errors, ['contract declares --primitive twice']);
});

/* ------------------------------------------------------------ target size */

const targetContract = {
  layers: ['primitive', 'semantic', 'component'],
  axes: ['base', 'scheme', 'density'],
  requiredSchemes: [],
  requiredDensities: ['comfortable'],
  tokens: [
    token('--slotted-target-min', { layer: 'semantic' }),
    token('--slotted-control-height-sm', { layer: 'semantic', axis: 'density' }),
  ],
};

test('accepts a control that meets the minimum target size', () => {
  assert.deepEqual(
    validateTheme(targetContract, {
      base: { '--slotted-target-min': '24px' },
      schemes: {},
      densities: { comfortable: { '--slotted-control-height-sm': '24px' } },
    }),
    [],
  );
});

test('rejects a control shorter than the minimum target size', () => {
  assert.deepEqual(
    validateTheme(targetContract, {
      base: { '--slotted-target-min': '24px' },
      schemes: {},
      densities: { comfortable: { '--slotted-control-height-sm': '22px' } },
    }),
    ['density comfortable --slotted-control-height-sm is 22px, below the 24px target size'],
  );
});

/* -------------------------------------------------------------- malformed */

const malformedVariantContainers = [
  { name: 'absent' },
  { name: 'undefined', value: undefined },
  { name: 'null', value: null },
  { name: 'string', value: 'bad' },
  { name: 'number', value: 42 },
  { name: 'array', value: ['unexpected'] },
];

function testMalformedTokenMaps(label, createInvalid, expected) {
  test(`normalizes malformed ${label} maps to missing tokens`, async (t) => {
    for (const { name, value } of malformedVariantContainers) {
      await t.test(name, () => {
        assert.deepEqual(validateTheme(contract, createInvalid(name, value)), expected);
      });
    }
  });
}

test('normalizes malformed scheme containers to ordered missing variants', async (t) => {
  for (const { name, value } of malformedVariantContainers) {
    await t.test(name, () => {
      const invalid = structuredClone(validTheme);
      if (name === 'absent') delete invalid.schemes;
      else invalid.schemes = value;

      assert.deepEqual(validateTheme(contract, invalid), [
        'scheme is missing required variant light',
        'scheme is missing required variant dark',
      ]);
    });
  }
});

test('normalizes malformed density containers to ordered missing variants', async (t) => {
  for (const { name, value } of malformedVariantContainers) {
    await t.test(name, () => {
      const invalid = structuredClone(validTheme);
      if (name === 'absent') delete invalid.densities;
      else invalid.densities = value;

      assert.deepEqual(validateTheme(contract, invalid), [
        'density is missing required variant comfortable',
        'density is missing required variant compact',
      ]);
    });
  }
});

testMalformedTokenMaps(
  'base',
  (name, value) => {
    const invalid = structuredClone(validTheme);
    if (name === 'absent') delete invalid.base;
    else invalid.base = value;
    return invalid;
  },
  ['base is missing --base'],
);

testMalformedTokenMaps(
  'scheme light',
  (name, value) => {
    const invalid = structuredClone(validTheme);
    invalid.schemes.light = value;
    return invalid;
  },
  ['scheme light is missing --scheme'],
);

testMalformedTokenMaps(
  'density comfortable',
  (name, value) => {
    const invalid = structuredClone(validTheme);
    invalid.densities.comfortable = value;
    return invalid;
  },
  ['density comfortable is missing --density'],
);

/* --------------------------------------------------------- reduced motion */

const reducedMotionContract = {
  layers: ['primitive', 'semantic', 'component'],
  axes: ['base', 'scheme', 'density'],
  requiredSchemes: [],
  requiredDensities: [],
  tokens: [token('--slotted-duration-short', { type: 'duration', reducedMotion: true })],
};

test('normalizes malformed reduced-motion maps to missing tokens', async (t) => {
  for (const { name, value } of malformedVariantContainers) {
    await t.test(name, () => {
      const theme = { base: { '--slotted-duration-short': '120ms' }, schemes: {}, densities: {} };
      if (name !== 'absent') theme.reducedMotion = value;
      assert.deepEqual(validateTheme(reducedMotionContract, theme), [
        'reducedMotion is missing --slotted-duration-short',
      ]);
    });
  }
});

test('reports a reduced-motion token outside the contract', () => {
  const errors = validateTheme(reducedMotionContract, {
    base: { '--slotted-duration-short': '120ms' },
    schemes: {},
    densities: {},
    reducedMotion: {
      '--slotted-duration-short': '1ms',
      '--slotted-duration-long': '1ms',
    },
  });
  assert.deepEqual(errors, ['reducedMotion contains unknown token --slotted-duration-long']);
});
