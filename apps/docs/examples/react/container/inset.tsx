import { Card, CardBody } from '@slotted/react/card';
import { Container } from '@slotted/react/container';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const INSETS = [0, 3, 6, 12] as const;

export default function ContainerInset() {
  return (
    <Stack gap={4}>
      {INSETS.map((inset) => (
        <Card key={inset}>
          <Container inset={inset} size="bleed">
            <Card>
              <CardBody>
                <Text>{`inset: ${inset}`}</Text>
              </CardBody>
            </Card>
          </Container>
        </Card>
      ))}
    </Stack>
  );
}
