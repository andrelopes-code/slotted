import { Badge, BadgeAnchor } from '@slotted/react/badge';
import { IconButton } from '@slotted/react/button';
import { Glyph } from '@slotted/react/icon';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';
import { VisuallyHidden } from '@slotted/react/visually-hidden';

const PLACEMENTS = ['top-end', 'top-start', 'bottom-end', 'bottom-start'] as const;

export default function BadgePlacement() {
  return (
    <Inline gap={8}>
      {PLACEMENTS.map((placement) => (
        <Stack key={placement} gap={2}>
          <BadgeAnchor placement={placement}>
            <IconButton aria-label="Open inbox">
              <Glyph name="inbox" />
            </IconButton>
            <Badge shape="dot" size="sm" tone="danger" variant="solid">
              <VisuallyHidden>New messages</VisuallyHidden>
            </Badge>
          </BadgeAnchor>
          <Text size="sm" tone="muted">
            {placement}
          </Text>
        </Stack>
      ))}
    </Inline>
  );
}
