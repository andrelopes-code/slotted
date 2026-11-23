import { expect, it } from 'vitest';

import * as slotted from './index';

it('exports no comparison mark: an application draws its own from linearScale', () => {
  // @ts-expect-error -- BarCompare is not part of the public API.
  expect(slotted.BarCompare).toBeUndefined();
  // @ts-expect-error -- PositionStrip is not part of the public API.
  expect(slotted.PositionStrip).toBeUndefined();
  // @ts-expect-error -- SegmentedBar is not part of the public API.
  expect(slotted.SegmentedBar).toBeUndefined();
});
