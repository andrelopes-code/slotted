import { Avatar } from '@slotted/react/avatar';
import { Glyph, Icon } from '@slotted/react/icon';
import { Inline } from '@slotted/react/inline';

export default function AvatarFallback() {
  return (
    <Inline align="center" gap={4}>
      <Avatar name="Maria Chen" size="lg" />
      <Avatar size="lg" />
      <Avatar name="Receiving dock" shape="square" size="lg" tone="info">
        <Icon>
          <Glyph name="inbox" />
        </Icon>
      </Avatar>
    </Inline>
  );
}
