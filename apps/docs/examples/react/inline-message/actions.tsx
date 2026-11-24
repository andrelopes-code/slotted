import { useState } from 'react';

import { Button } from '@slotted/react/button';
import { InlineMessage, InlineMessageActions } from '@slotted/react/inline-message';

export default function InlineMessageActionsExample() {
  const [quantity, setQuantity] = useState<number | null>(null);

  if (quantity !== null) {
    return (
      <InlineMessage live="polite" size="md" tone="success">
        Quantity set to {quantity}.
      </InlineMessage>
    );
  }

  return (
    <InlineMessage live="polite" size="md" tone="warning">
      Order 4821 lists 240 units. Did you mean 24?
      <InlineMessageActions>
        <Button onClick={() => setQuantity(24)} variant="outline">
          Use 24
        </Button>
        <Button onClick={() => setQuantity(240)} variant="ghost">
          Keep 240
        </Button>
      </InlineMessageActions>
    </InlineMessage>
  );
}
