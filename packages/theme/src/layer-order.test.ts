import { expect, it } from 'vitest';

import { LAYER_ORDER_STATEMENT } from './layer-order';

it('publishes the order of every layer the library writes into', () => {
  expect(LAYER_ORDER_STATEMENT).toBe(
    '@layer slotted.reset, slotted.tokens, slotted.theme, slotted.components, slotted.theme-rules;\n',
  );
});
