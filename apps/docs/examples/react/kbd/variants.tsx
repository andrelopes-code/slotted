import { Inline } from '@slotted/react/inline';
import { Shortcut } from '@slotted/react/kbd';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function KbdVariants() {
  return (
    <Stack gap={3}>
      <Inline justify="between" align="center">
        <Text>raised</Text>
        <Shortcut keys="mod+b" variant="raised" />
      </Inline>
      <Inline justify="between" align="center">
        <Text>outline</Text>
        <Shortcut keys="mod+b" variant="outline" />
      </Inline>
      <Inline justify="between" align="center">
        <Text>soft</Text>
        <Shortcut keys="mod+b" variant="soft" />
      </Inline>
      <Inline justify="between" align="center">
        <Text>plain</Text>
        <Shortcut keys="mod+b" variant="plain" />
      </Inline>
    </Stack>
  );
}
