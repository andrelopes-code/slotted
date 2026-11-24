import { Divider } from '@slotted/react/divider';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function DividerVerticalLabel() {
  return (
    <Inline gap={4}>
      <Stack gap={1}>
        <Text weight="semibold">Pay by card</Text>
        <Text size="sm" tone="muted">
          Charged today
        </Text>
        <Text size="sm" tone="muted">
          Receipt by email
        </Text>
      </Stack>
      <Divider label="Or" orientation="vertical" />
      <Stack gap={1}>
        <Text weight="semibold">Pay by transfer</Text>
        <Text size="sm" tone="muted">
          Due in 30 days
        </Text>
        <Text size="sm" tone="muted">
          Reference INV-20418
        </Text>
      </Stack>
    </Inline>
  );
}
