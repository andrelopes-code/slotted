import { Badge } from '@slotted/react/badge';
import { Inline } from '@slotted/react/inline';

export default function BadgeSizes() {
  return (
    <Inline align="center" gap={3}>
      <Badge size="sm" tone="info">
        Small
      </Badge>
      <Badge size="md" tone="info">
        Medium
      </Badge>
      <Badge size="lg" tone="info">
        Large
      </Badge>
    </Inline>
  );
}
