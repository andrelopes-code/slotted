import { Avatar, AvatarDefaultsProvider } from '@slotted/react/avatar';
import { Inline } from '@slotted/react/inline';

export default function AvatarDefaults() {
  return (
    <AvatarDefaultsProvider shape="square" size="lg" variant="solid">
      <Inline align="center" gap={4}>
        <Avatar name="Night shift" />
        <Avatar name="Receiving" />
        <Avatar name="Maria Chen" shape="circle" size="sm" />
      </Inline>
    </AvatarDefaultsProvider>
  );
}
