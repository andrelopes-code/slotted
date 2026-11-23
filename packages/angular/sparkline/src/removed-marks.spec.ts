import { expect, it } from 'vitest';

import * as sparkline from './public-api';

it('exports no comparison mark: an application draws its own from linearScale', () => {
  // @ts-expect-error -- SlBarCompare is not part of the public API.
  expect(sparkline.SlBarCompare).toBeUndefined();
  // @ts-expect-error -- SlPositionStrip is not part of the public API.
  expect(sparkline.SlPositionStrip).toBeUndefined();
});
