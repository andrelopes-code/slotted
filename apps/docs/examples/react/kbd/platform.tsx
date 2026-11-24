import { Inline } from '@slotted/react/inline';
import { Shortcut } from '@slotted/react/kbd';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function KbdPlatform() {
  return (
    <Stack gap={3}>
      <Inline justify="between" align="center">
        <Text>mac</Text>
        <Shortcut keys="meta+shift+s" platform="mac" />
      </Inline>
      <Inline justify="between" align="center">
        <Text>windows</Text>
        <Shortcut keys="meta+shift+s" platform="windows" />
      </Inline>
      <Inline justify="between" align="center">
        <Text>linux</Text>
        <Shortcut keys="meta+shift+s" platform="linux" />
      </Inline>
      <Inline justify="between" align="center">
        <Text>other</Text>
        <Shortcut keys="meta+shift+s" platform="other" />
      </Inline>
      <Inline justify="between" align="center">
        <Text>auto</Text>
        <Shortcut keys="meta+shift+s" platform="auto" />
      </Inline>
    </Stack>
  );
}
