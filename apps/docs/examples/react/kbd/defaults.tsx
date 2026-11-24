import { Inline } from '@slotted/react/inline';
import { KbdDefaultsProvider, Shortcut } from '@slotted/react/kbd';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function KbdDefaults() {
  return (
    <KbdDefaultsProvider platform="windows" size="sm" variant="soft">
      <Stack gap={3}>
        <Inline justify="between" align="center">
          <Text>Open search</Text>
          <Shortcut keys="mod+k" />
        </Inline>
        <Inline justify="between" align="center">
          <Text>Create order</Text>
          <Shortcut keys="mod+n" />
        </Inline>
        <Inline justify="between" align="center">
          <Text>Print packing slip</Text>
          <Shortcut keys="mod+p" variant="outline" />
        </Inline>
      </Stack>
    </KbdDefaultsProvider>
  );
}
