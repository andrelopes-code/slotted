import { SkeletonText } from '@slotted/react/skeleton';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const ANIMATIONS = ['shimmer', 'pulse', 'none'] as const;

export default function SkeletonAnimation() {
  return (
    <Stack gap={5}>
      {ANIMATIONS.map((animation) => (
        <Stack key={animation} gap={2}>
          <Text size="sm" tone="muted">
            {animation}
          </Text>
          <SkeletonText animation={animation} lines={2} />
        </Stack>
      ))}
    </Stack>
  );
}
