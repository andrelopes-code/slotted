import { Inline } from '@slotted/react/inline';
import { Skeleton, SkeletonRegion } from '@slotted/react/skeleton';
import { Stack } from '@slotted/react/stack';

export default function SkeletonBasic() {
  return (
    <SkeletonRegion messages={{ label: 'Loading the dock supervisor' }}>
      <Inline align="center" gap={4}>
        <Skeleton shape="circle" size="lg" />
        <Stack gap={2}>
          <Skeleton inlineSize="9rem" />
          <Skeleton inlineSize="6rem" />
        </Stack>
      </Inline>
    </SkeletonRegion>
  );
}
