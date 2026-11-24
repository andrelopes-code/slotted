import { Card, CardBody } from '@slotted/react/card';
import { Grid } from '@slotted/react/grid';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const WIDTHS = [
  { size: 'xs', rem: '8rem' },
  { size: 'sm', rem: '12rem' },
  { size: 'md', rem: '16rem' },
  { size: 'lg', rem: '20rem' },
  { size: 'xl', rem: '24rem' },
] as const;

const BAYS = ['Bay A1', 'Bay A2', 'Bay B1', 'Bay B2'] as const;

export default function GridMinItemWidth() {
  return (
    <Stack gap={6}>
      {WIDTHS.map((width) => (
        <Stack key={width.size} gap={3}>
          <Text size="sm" tone="muted">{`minItemWidth: ${width.size} (${width.rem})`}</Text>

          <Grid gap={3} minItemWidth={width.size}>
            {BAYS.map((bay) => (
              <Card key={bay}>
                <CardBody>
                  <Text>{bay}</Text>
                </CardBody>
              </Card>
            ))}
          </Grid>
        </Stack>
      ))}
    </Stack>
  );
}
