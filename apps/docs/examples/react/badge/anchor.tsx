import { useId } from 'react';
import { Badge, BadgeAnchor } from '@slotted/react/badge';
import { Button, IconButton } from '@slotted/react/button';
import { Glyph } from '@slotted/react/icon';
import { Inline } from '@slotted/react/inline';
import { VisuallyHidden } from '@slotted/react/visually-hidden';

export default function BadgeAnchored() {
  const inboxCountId = useId();

  return (
    <Inline align="center" gap={8}>
      <BadgeAnchor>
        <IconButton aria-label="Notifications">
          <Glyph name="bell" />
        </IconButton>
        <Badge count={7} size="sm" tone="danger" variant="solid">
          <VisuallyHidden>unread notifications</VisuallyHidden>
        </Badge>
      </BadgeAnchor>
      <BadgeAnchor>
        <Button aria-describedby={inboxCountId}>Inbox</Button>
        <Badge count={128} id={inboxCountId} size="sm" tone="accent" variant="solid">
          <VisuallyHidden>unread messages</VisuallyHidden>
        </Badge>
      </BadgeAnchor>
    </Inline>
  );
}
