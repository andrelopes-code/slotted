import { Inline } from '@slotted/react/inline';
import { Shortcut } from '@slotted/react/kbd';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function KbdWords() {
  return (
    <Stack gap={3}>
      <Inline justify="between" align="center">
        <Text>Remove row</Text>
        <Shortcut
          keys="mod+delete"
          legends={{ mod: 'Control', delete: 'Delete' }}
          names={{ delete: 'Remove' }}
          platform="windows"
        />
      </Inline>
      <Inline justify="between" align="center">
        <Text>Export report</Text>
        <Shortcut keys="mod+shift+e" platform="windows" separator="-" />
      </Inline>
      <Inline justify="between" align="center">
        <Text>Go to inbox</Text>
        <Shortcut keys="g i" messages={{ then: 'followed by' }} />
      </Inline>
    </Stack>
  );
}
