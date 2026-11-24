import { AspectRatio } from '@slotted/react/aspect-ratio';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const WAREHOUSE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 120'%3E%3Crect width='160' height='120' fill='%231e3a5f'/%3E%3Crect x='20' y='50' width='120' height='50' fill='%2393c5fd'/%3E%3Cpath d='M10 50 80 20l70 30Z' fill='%23dbeafe'/%3E%3Crect x='65' y='70' width='30' height='30' fill='%231e3a5f'/%3E%3C/svg%3E";

export default function AspectRatioFigure() {
  return (
    <Stack gap={3} render={(props) => <figure {...props} style={{ margin: 0 }} />}>
      <AspectRatio ratio="landscape">
        <img alt="Illustration of the Rotterdam warehouse" src={WAREHOUSE} />
      </AspectRatio>
      <Text render={(props) => <figcaption {...props} />} size="sm" tone="muted">
        Rotterdam warehouse, dock 4, March inventory count
      </Text>
    </Stack>
  );
}
