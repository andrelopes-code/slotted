import { Inline } from '@slotted/react/inline';
import { Skeleton } from '@slotted/react/skeleton';

export default function SkeletonShapes() {
  return (
    <Inline align="center" gap={5}>
      <Skeleton inlineSize="6rem" shape="text" />
      <Skeleton blockSize="4rem" inlineSize="6rem" shape="block" />
      <Skeleton shape="circle" size="lg" />
      <Skeleton shape="square" size="lg" />
    </Inline>
  );
}
