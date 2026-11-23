import { expect, it } from 'vitest';

import * as progressIndicator from './public-api';

it('exports no segmented bar: an application draws its own split bar', () => {
  // @ts-expect-error -- SlSegmentedBar is not part of the public API.
  expect(progressIndicator.SlSegmentedBar).toBeUndefined();
});
