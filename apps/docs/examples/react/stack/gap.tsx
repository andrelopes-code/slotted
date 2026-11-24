import { Badge } from '@slotted/react/badge';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const GAPS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export default function StackGap() {
  return (
    <Inline align="start" gap={8}>
      {GAPS.map((gap) => (
        <Stack key={gap} gap={1}>
          <Text size="xs" tone="muted">
            Gap {gap}
          </Text>
          <Stack gap={gap}>
            <Badge tone="success">Packed</Badge>
            <Badge tone="warning">Late</Badge>
            <Badge tone="danger">Held</Badge>
          </Stack>
        </Stack>
      ))}
    </Inline>
  );
}
