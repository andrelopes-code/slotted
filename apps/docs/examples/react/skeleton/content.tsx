import { Skeleton, SkeletonText } from '@slotted/react/skeleton';
import { Stack } from '@slotted/react/stack';
import { Heading } from '@slotted/react/typography';

export default function SkeletonContent() {
  return (
    <Stack gap={6}>
      <Heading level={2} size="2xl">
        <Skeleton inlineSize="60%" />
      </Heading>
      <Heading level={2} size="md">
        <Skeleton inlineSize="45%" />
      </Heading>
      <div dir="rtl">
        <SkeletonText lines={3} />
      </div>
    </Stack>
  );
}
