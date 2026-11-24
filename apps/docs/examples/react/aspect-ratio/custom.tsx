import { AspectRatio } from '@slotted/react/aspect-ratio';
import { Card, CardBody } from '@slotted/react/card';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function AspectRatioCustom() {
  return (
    <Stack gap={4}>
      <AspectRatio ratio={[2, 1]}>
        <Card>
          <CardBody>
            <Text size="sm">A pair, [2, 1]: written as 2 / 1.</Text>
          </CardBody>
        </Card>
      </AspectRatio>
      <AspectRatio ratio={1.85}>
        <Card>
          <CardBody>
            <Text size="sm">A number, 1.85: written as its quotient.</Text>
          </CardBody>
        </Card>
      </AspectRatio>
    </Stack>
  );
}
