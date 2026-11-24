import { SkeletonText } from '@slotted/react/skeleton';
import { Stack } from '@slotted/react/stack';

export default function SkeletonTextRows() {
  return (
    <Stack gap={6}>
      <SkeletonText />
      <SkeletonText lastLineSize="40%" lines={5} />
      <SkeletonText inlineSize="12rem" lines={1} />
    </Stack>
  );
}
