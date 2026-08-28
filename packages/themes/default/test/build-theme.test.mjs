import assert from 'node:assert/strict';
import test from 'node:test';

import { renderThemeCss } from '../scripts/build-theme.mjs';

test('renders independent theme, scheme, and density scopes', () => {
  const css = renderThemeCss(
    { base: ['--base'], scheme: ['--scheme'], density: ['--density'] },
    {
      name: 'test',
      base: { '--base': '1px' },
      schemes: { light: { '--scheme': '#fff' } },
      densities: { compact: { '--density': '2rem' } },
    },
  );

  assert.match(css, /data-slotted-theme="test"/);
  assert.match(css, /data-slotted-scheme="light"/);
  assert.match(css, /data-slotted-density="compact"/);
  assert.match(css, /--scheme: #fff/);
});
