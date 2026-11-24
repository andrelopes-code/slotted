import { Card, CardBody } from '@slotted/react/card';
import { Inline } from '@slotted/react/inline';
import { Shortcut } from '@slotted/react/kbd';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function KbdCommands() {
  return (
    <Card>
      <CardBody>
        <Stack gap={3}>
          <Inline justify="between" align="center">
            <Text>Open command palette</Text>
            <Shortcut keys="mod+k" size="sm" variant="plain" />
          </Inline>
          <Inline justify="between" align="center">
            <Text>Duplicate order</Text>
            <Shortcut keys="mod+d" size="sm" variant="plain" />
          </Inline>
          <Inline justify="between" align="center">
            <Text>Archive order</Text>
            <Shortcut keys="mod+shift+a" size="sm" variant="plain" />
          </Inline>
        </Stack>
      </CardBody>
    </Card>
  );
}
