import { AspectRatio } from '@slotted/react/aspect-ratio';
import { Card } from '@slotted/react/card';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const WAREHOUSE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 120'%3E%3Crect width='160' height='120' fill='%231e3a5f'/%3E%3Crect x='20' y='50' width='120' height='50' fill='%2393c5fd'/%3E%3Cpath d='M10 50 80 20l70 30Z' fill='%23dbeafe'/%3E%3Crect x='65' y='70' width='30' height='30' fill='%231e3a5f'/%3E%3C/svg%3E";

export default function AspectRatioMedia() {
  return (
    <Stack gap={4}>
      <Text size="sm" tone="muted">
        A 4:3 picture in a video frame
      </Text>
      <Card>
        <AspectRatio ratio="video">
          <img alt="Illustration of the Rotterdam warehouse" src={WAREHOUSE} />
        </AspectRatio>
      </Card>
      <Text size="sm" tone="muted">
        The same picture in a square frame
      </Text>
      <Card>
        <AspectRatio ratio="square">
          <img alt="Illustration of the Rotterdam warehouse" src={WAREHOUSE} />
        </AspectRatio>
      </Card>
    </Stack>
  );
}
