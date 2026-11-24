import { Inline } from '@slotted/react/inline';
import { Shortcut } from '@slotted/react/kbd';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function KbdSequence() {
  return (
    <Stack gap={3}>
      <Inline justify="between" align="center">
        <Text>Go to the inbox</Text>
        <Shortcut keys="g i" />
      </Inline>
      <Inline justify="between" align="center">
        <Text>Go to orders</Text>
        <Shortcut keys="g o" />
      </Inline>
      <Inline justify="between" align="center">
        <Text>Shortcuts</Text>
        <Shortcut keys="mod+k mod+s" />
      </Inline>
    </Stack>
  );
}
