import { Inline } from '@slotted/react/inline';
import { Skeleton } from '@slotted/react/skeleton';
import { Stack } from '@slotted/react/stack';

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

export default function SkeletonSizes() {
  return (
    <Stack gap={4}>
      <Inline align="center" gap={3}>
        {SIZES.map((size) => (
          <Skeleton key={size} shape="circle" size={size} />
        ))}
      </Inline>
      <Inline align="center" gap={3}>
        {SIZES.map((size) => (
          <Skeleton key={size} shape="square" size={size} />
        ))}
      </Inline>
    </Stack>
  );
}
