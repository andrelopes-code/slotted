import { Glyph } from '@slotted/react/icon';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';
import { VisuallyHidden } from '@slotted/react/visually-hidden';

export default function VisuallyHiddenCount() {
  return (
    <Stack gap={3}>
      <Inline gap={2}>
        <Glyph name="bell" />
        <Text numeric="tabular" weight="semibold">
          3
        </Text>
        <VisuallyHidden>unread notifications</VisuallyHidden>
      </Inline>
      <Text size="sm" tone="muted">
        Visible: a bell and 3. Read aloud: 3 unread notifications.
      </Text>
    </Stack>
  );
}
