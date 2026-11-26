import { Card, CardBody } from '@slotted/react/card';
import { LoadingOverlay, LoadingOverlayDefaultsProvider } from '@slotted/react/loading-overlay';
import { Stack } from '@slotted/react/stack';
import { Heading, Text } from '@slotted/react/typography';

export default function LoadingOverlayDefaults() {
  return (
    <LoadingOverlayDefaultsProvider delay={200} minDuration={400} size="sm" veil="blur">
      <Stack gap={4}>
        <LoadingOverlay messages={{ label: 'Loading orders' }}>
          <Card>
            <CardBody>
              <Heading level={3} size="md">
                Open orders
              </Heading>
              <Text>Takes the blur and the small step from the provider.</Text>
            </CardBody>
          </Card>
        </LoadingOverlay>
        <LoadingOverlay messages={{ label: 'Loading returns' }} veil="wash">
          <Card>
            <CardBody>
              <Heading level={3} size="md">
                Returns
              </Heading>
              <Text>Keeps the small step and sets its own veil.</Text>
            </CardBody>
          </Card>
        </LoadingOverlay>
      </Stack>
    </LoadingOverlayDefaultsProvider>
  );
}
