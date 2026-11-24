import type { CSSProperties } from 'react';

import { Card, CardBody } from '@slotted/react/card';
import { Container } from '@slotted/react/container';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const ALIGNS = ['center', 'start', 'end'] as const;

const MAXIMA = { '--slotted-container-measure': '40ch' } as CSSProperties;

export default function ContainerAlign() {
  return (
    <Stack gap={4} style={MAXIMA}>
      {ALIGNS.map((align) => (
        <Card key={align}>
          <Container align={align} size="measure">
            <Card>
              <CardBody>
                <Text>{`align: ${align}`}</Text>
              </CardBody>
            </Card>
          </Container>
        </Card>
      ))}
    </Stack>
  );
}
