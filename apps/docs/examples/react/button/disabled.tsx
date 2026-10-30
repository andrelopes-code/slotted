import { useId } from 'react';

import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function ButtonDisabled() {
  const hintId = useId();

  return (
    <Stack gap={2}>
      <Inline gap={2}>
        <Button disabled tone="secondary" variant="outline">
          Export
        </Button>
        <Button aria-describedby={hintId} disabled focusableWhenDisabled>
          Submit for approval
        </Button>
      </Inline>
      <Text id={hintId} size="sm" tone="muted">
        Add at least one line item before submitting.
      </Text>
    </Stack>
  );
}
