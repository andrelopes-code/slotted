import { Inline } from '@slotted/react/inline';
import { Kbd } from '@slotted/react/kbd';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function KbdKeys() {
  return (
    <Stack gap={3}>
      <Inline justify="between" align="center">
        <Text>Next field</Text>
        <Kbd keyName="tab" />
      </Inline>
      <Inline justify="between" align="center">
        <Text>Close the panel</Text>
        <Kbd keyName="esc" />
      </Inline>
      <Inline justify="between" align="center">
        <Text>Previous order</Text>
        <Kbd keyName="up" />
      </Inline>
      <Inline justify="between" align="center">
        <Text>Refresh the list</Text>
        <Kbd keyName="f5" />
      </Inline>
      <Inline justify="between" align="center">
        <Text>Open the row menu</Text>
        <Kbd>Right click</Kbd>
      </Inline>
    </Stack>
  );
}
