import { AspectRatio } from '@slotted/react/aspect-ratio';
import { Card, CardBody } from '@slotted/react/card';
import { Grid } from '@slotted/react/grid';
import { Text } from '@slotted/react/typography';

const RATIOS = [
  { name: 'square', label: 'square, 1:1' },
  { name: 'landscape', label: 'landscape, 4:3' },
  { name: 'portrait', label: 'portrait, 3:4' },
  { name: 'video', label: 'video, 16:9' },
  { name: 'wide', label: 'wide, 21:9' },
] as const;

export default function AspectRatioRatios() {
  return (
    <Grid columns={3} gap={4} minItemWidth="xs">
      {RATIOS.map((ratio) => (
        <AspectRatio key={ratio.name} ratio={ratio.name}>
          <Card>
            <CardBody>
              <Text size="sm">{ratio.label}</Text>
            </CardBody>
          </Card>
        </AspectRatio>
      ))}
    </Grid>
  );
}
