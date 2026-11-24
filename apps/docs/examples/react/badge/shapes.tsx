import { Badge } from '@slotted/react/badge';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';
import { VisuallyHidden } from '@slotted/react/visually-hidden';

export default function BadgeShapes() {
  return (
    <Stack gap={3}>
      <Inline align="center" gap={3}>
        <Badge shape="pill" tone="warning">
          Backordered
        </Badge>
        <Text size="sm" tone="muted">
          pill
        </Text>
      </Inline>
      <Inline align="center" gap={3}>
        <Badge shape="square" tone="warning">
          Backordered
        </Badge>
        <Text size="sm" tone="muted">
          square
        </Text>
      </Inline>
      <Inline align="center" gap={3}>
        <Badge shape="dot" tone="success" variant="solid">
          <VisuallyHidden>Online</VisuallyHidden>
        </Badge>
        <Text>Carrier API</Text>
      </Inline>
    </Stack>
  );
}
