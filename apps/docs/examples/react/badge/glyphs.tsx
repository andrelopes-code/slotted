import { Badge } from '@slotted/react/badge';
import { Glyph } from '@slotted/react/icon';
import { Inline } from '@slotted/react/inline';

export default function BadgeGlyphs() {
  return (
    <Inline gap={3}>
      <Badge start={<Glyph name="clock" />} tone="warning">
        Due in 2 days
      </Badge>
      <Badge end={<Glyph name="inbox" />} tone="info">
        Unassigned
      </Badge>
    </Inline>
  );
}
