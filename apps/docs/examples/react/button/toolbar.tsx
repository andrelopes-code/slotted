import { useId } from 'react';

import { Button, IconButton } from '@slotted/react/button';
import { Glyph } from '@slotted/react/icon';
import { Toolbar, ToolbarSeparator, ToolbarSpacer } from '@slotted/react/toolbar';
import { Text } from '@slotted/react/typography';

export default function ButtonToolbar() {
  const reasonId = useId();

  return (
    <Toolbar aria-label="Order SO-1187">
      <Button start={<Glyph name="file-text" />} tone="secondary" variant="ghost">
        Packing slip
      </Button>
      <Button tone="secondary" variant="ghost">
        Duplicate
      </Button>
      <ToolbarSeparator />
      <IconButton aria-label="Copy order number">
        <Glyph name="copy" />
      </IconButton>
      <IconButton
        aria-describedby={reasonId}
        aria-label="Delete order"
        disabled
        focusableWhenDisabled
        tone="danger"
      >
        <Glyph name="trash" />
      </IconButton>
      <ToolbarSpacer />
      <Text id={reasonId} size="sm" tone="muted">
        Shipped orders cannot be deleted.
      </Text>
    </Toolbar>
  );
}
