import { Inline } from '@slotted/react/inline';
import { Kbd } from '@slotted/react/kbd';
import { Stack } from '@slotted/react/stack';
import { Heading, Text } from '@slotted/react/typography';

export default function KbdSizes() {
  return (
    <Stack gap={4}>
      <Inline gap={3} align="center">
        <Kbd keyName="escape" size="xs" />
        <Kbd keyName="escape" size="sm" />
        <Kbd keyName="escape" size="md" />
        <Kbd keyName="escape" size="lg" />
      </Inline>
      <Heading level={3} size="md">
        Press <Kbd keyName="escape" size="inherit" /> to cancel the count
      </Heading>
      <Text size="sm">
        Press <Kbd keyName="escape" size="inherit" /> to discard the draft.
      </Text>
    </Stack>
  );
}
