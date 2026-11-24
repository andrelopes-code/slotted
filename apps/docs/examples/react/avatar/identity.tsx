import { Avatar } from '@slotted/react/avatar';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function AvatarIdentity() {
  return (
    <Stack gap={4}>
      <Stack gap={2}>
        <Text size="sm" tone="muted">
          From the name
        </Text>
        <Inline gap={3}>
          <Avatar name="Maria Chen" />
          <Avatar name="Marta Okafor" />
          <Avatar name="Jonas Weber" />
          <Avatar name="Elena Rossi" />
        </Inline>
      </Stack>
      <Stack gap={2}>
        <Text size="sm" tone="muted">
          Same idFor, different names
        </Text>
        <Inline gap={3}>
          <Avatar idFor="emp-1042" name="Maria Chen" />
          <Avatar idFor="emp-1042" name="M. Chen" />
        </Inline>
      </Stack>
      <Stack gap={2}>
        <Text size="sm" tone="muted">
          Own initials
        </Text>
        <Inline gap={3}>
          <Avatar initials="D4" name="Dock 4 inbound" shape="square" />
        </Inline>
      </Stack>
    </Stack>
  );
}
