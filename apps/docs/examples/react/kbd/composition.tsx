import { Inline } from '@slotted/react/inline';
import { Kbd, Shortcut } from '@slotted/react/kbd';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function KbdComposition() {
  return (
    <Stack gap={3}>
      <Inline justify="between" align="center">
        <Text>Select a range of rows</Text>
        <Shortcut platform="windows" size="sm" variant="soft">
          <Kbd keyName="shift" />
          <Kbd>Click</Kbd>
        </Shortcut>
      </Inline>
      <Inline justify="between" align="center">
        <Text>Add a row to the selection</Text>
        <Shortcut platform="windows" size="sm" variant="soft">
          <Kbd keyName="mod" />
          <Kbd>Click</Kbd>
        </Shortcut>
      </Inline>
    </Stack>
  );
}
