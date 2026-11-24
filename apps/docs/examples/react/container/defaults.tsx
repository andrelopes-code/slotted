import type { CSSProperties } from 'react';

import { Card, CardBody } from '@slotted/react/card';
import { Container, ContainerDefaultsProvider } from '@slotted/react/container';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const MAXIMA = { '--slotted-container-measure': '40ch' } as CSSProperties;

export default function ContainerDefaults() {
  return (
    <ContainerDefaultsProvider align="start" inset={9} size="measure">
      <Stack gap={4} style={MAXIMA}>
        <Card>
          <Container>
            <Card>
              <CardBody>
                <Text>Takes size, inset and align from the provider.</Text>
              </CardBody>
            </Card>
          </Container>
        </Card>

        <Card>
          <Container align="center" inset={3} size="wide">
            <Card>
              <CardBody>
                <Text>States its own size, inset and align.</Text>
              </CardBody>
            </Card>
          </Container>
        </Card>
      </Stack>
    </ContainerDefaultsProvider>
  );
}
