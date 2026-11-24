import { Inline } from '@slotted/react/inline';
import { Kbd, Shortcut } from '@slotted/react/kbd';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function KbdStates() {
  return (
    <Stack gap={3}>
      <Inline justify="between" align="center">
        <Text>Approve payment run</Text>
        <Shortcut keys="mod+enter" />
      </Inline>
      <Inline justify="between" align="center">
        <Text>Reverse posting</Text>
        <Shortcut disabled keys="mod+shift+r" />
      </Inline>
      <Inline justify="between" align="center">
        <Text>Dispatch to carrier</Text>
        <Kbd disabled keyName="enter" />
      </Inline>
    </Stack>
  );
}
