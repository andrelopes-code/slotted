import type { CSSProperties } from 'react';

import { Card, CardBody } from '@slotted/react/card';
import { Container, ContainerBreakout } from '@slotted/react/container';
import { Stack } from '@slotted/react/stack';
import { Heading, Text } from '@slotted/react/typography';

const COLUMN = {
  '--slotted-container-measure': '40ch',
  rowGap: 'var(--slotted-space-5)',
} as CSSProperties;

export default function ContainerBreakoutExample() {
  return (
    <Container size="measure" style={COLUMN}>
      <Stack gap={3}>
        <Heading level={2} size="md">
          Quarter-end stock count
        </Heading>
        <Text>
          Counts finished at 14 of 14 sites. Three sites report a variance above 2% and are listed
          below.
        </Text>
      </Stack>

      <ContainerBreakout>
        <Card>
          <CardBody>
            <Text>Singapore +2.4%, Chicago -3.1%, Osaka +2.2%. 41,926 units counted.</Text>
          </CardBody>
        </Card>
      </ContainerBreakout>

      <Text>The text returns to the same column after the breakout.</Text>
    </Container>
  );
}
