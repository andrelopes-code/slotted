import type { CSSProperties } from 'react';

import { Card, CardBody } from '@slotted/react/card';
import { Container } from '@slotted/react/container';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const SIZES = ['measure', 'content', 'wide', 'full', 'bleed'] as const;

const MAXIMA = {
  '--slotted-container-measure': '40ch',
  '--slotted-container-content': '28rem',
  '--slotted-container-wide': '34rem',
  '--slotted-container-full': '38rem',
} as CSSProperties;

export default function ContainerSize() {
  return (
    <Stack gap={4} style={MAXIMA}>
      {SIZES.map((size) => (
        <Container key={size} inset={0} size={size}>
          <Card>
            <CardBody>
              <Text>{size}</Text>
            </CardBody>
          </Card>
        </Container>
      ))}
    </Stack>
  );
}
