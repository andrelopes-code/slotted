import { Card, CardBody } from '@slotted/react/card';
import { LoadingOverlay } from '@slotted/react/loading-overlay';
import { Heading, Text } from '@slotted/react/typography';

export default function LoadingOverlayContent() {
  return (
    <LoadingOverlay
      cancellable
      description="Stopping now would leave half the period reconciled."
      messages={{
        cancel: 'Stop reconciling',
        label: 'Reconciling the period entries against the bank statement',
      }}
    >
      <Card>
        <CardBody>
          <Heading level={3} size="md">
            March close
          </Heading>
          <Text>1 204 entries, 37 without a bank match.</Text>
        </CardBody>
      </Card>
    </LoadingOverlay>
  );
}
