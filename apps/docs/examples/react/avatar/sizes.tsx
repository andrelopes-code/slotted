import { Avatar } from '@slotted/react/avatar';
import { Inline } from '@slotted/react/inline';

export default function AvatarSizes() {
  return (
    <Inline align="center" gap={4}>
      <Avatar name="Maria Chen" size="xs" />
      <Avatar name="Maria Chen" size="sm" />
      <Avatar name="Maria Chen" size="md" />
      <Avatar name="Maria Chen" size="lg" />
      <Avatar name="Maria Chen" size="xl" />
    </Inline>
  );
}
