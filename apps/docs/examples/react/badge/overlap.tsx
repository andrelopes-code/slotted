import { Avatar } from '@slotted/react/avatar';
import { Badge, BadgeAnchor } from '@slotted/react/badge';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';
import { VisuallyHidden } from '@slotted/react/visually-hidden';

export default function BadgeOverlap() {
  return (
    <Inline gap={8}>
      <Stack gap={2}>
        <BadgeAnchor overlap="rectangle" placement="bottom-end">
          <Avatar name="Marta Okafor" size="lg" />
          <Badge shape="dot" size="sm" tone="success" variant="solid">
            <VisuallyHidden>Online</VisuallyHidden>
          </Badge>
        </BadgeAnchor>
        <Text size="sm" tone="muted">
          rectangle
        </Text>
      </Stack>
      <Stack gap={2}>
        <BadgeAnchor overlap="circle" placement="bottom-end">
          <Avatar name="Marta Okafor" size="lg" />
          <Badge shape="dot" size="sm" tone="success" variant="solid">
            <VisuallyHidden>Online</VisuallyHidden>
          </Badge>
        </BadgeAnchor>
        <Text size="sm" tone="muted">
          circle
        </Text>
      </Stack>
      <Stack gap={2}>
        <BadgeAnchor offset={{ x: 2, y: 2 }} overlap="circle" placement="bottom-end">
          <Avatar name="Marta Okafor" size="lg" />
          <Badge shape="dot" size="sm" tone="success" variant="solid">
            <VisuallyHidden>Online</VisuallyHidden>
          </Badge>
        </BadgeAnchor>
        <Text size="sm" tone="muted">
          circle, offset 2px
        </Text>
      </Stack>
    </Inline>
  );
}
