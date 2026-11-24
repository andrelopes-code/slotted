import { Divider } from '@slotted/react/divider';
import { Stack } from '@slotted/react/stack';
import { Heading, Text } from '@slotted/react/typography';

export default function DividerBasic() {
  return (
    <Stack gap={4}>
      <Stack gap={1}>
        <Heading level={2} size="sm">
          Billing
        </Heading>
        <Text size="sm" tone="muted">
          Invoices are issued on the first business day of each month.
        </Text>
      </Stack>
      <Divider />
      <Stack gap={1}>
        <Heading level={2} size="sm">
          Members
        </Heading>
        <Text size="sm" tone="muted">
          Eleven people in the Northwind operations team can approve orders.
        </Text>
      </Stack>
    </Stack>
  );
}
