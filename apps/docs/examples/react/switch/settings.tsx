import { Card, CardBody, CardHeader } from '@slotted/react/card';
import { Divider } from '@slotted/react/divider';
import { Stack } from '@slotted/react/stack';
import { Switch, SwitchDefaultsProvider } from '@slotted/react/switch';
import { Heading, Text } from '@slotted/react/typography';

export default function SwitchSettings() {
  return (
    <Card>
      <CardHeader>
        <Heading level={3} size="md">
          Warehouse notifications
        </Heading>
        <Text size="sm" tone="muted">
          Sent to ops@northwind.example.
        </Text>
      </CardHeader>
      <CardBody>
        <SwitchDefaultsProvider labelPlacement="start">
          <Stack gap={4}>
            <Switch defaultChecked description="When a product falls below its reorder point.">
              Low stock
            </Switch>
            <Divider />
            <Switch defaultChecked description="When a carrier misses its pickup window.">
              Late pickups
            </Switch>
            <Divider />
            <Switch description="When a count differs from the system by more than 2%.">
              Cycle count variances
            </Switch>
          </Stack>
        </SwitchDefaultsProvider>
      </CardBody>
    </Card>
  );
}
