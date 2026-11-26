import { useState } from 'react';

import { Glyph } from '@slotted/react/icon';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Toggle } from '@slotted/react/toggle';
import { Text } from '@slotted/react/typography';

export default function ToggleControlled() {
  const [wrap, setWrap] = useState(false);

  return (
    <Stack gap={2}>
      <Inline>
        <Toggle
          icon={<Glyph name="text-wrap" />}
          onPressedChange={(pressed) => setWrap(pressed)}
          pressed={wrap}
        >
          Wrap lines
        </Toggle>
      </Inline>
      <Text size="sm" tone="muted">
        {wrap ? 'Long order notes wrap onto further lines.' : 'Long order notes stay on one line.'}
      </Text>
    </Stack>
  );
}
