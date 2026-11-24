import { Divider } from '@slotted/react/divider';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function DividerLabel() {
  return (
    <Stack gap={4}>
      <Text>Pay with the card on file, ending in 4242.</Text>
      <Divider label="Or" />
      <Text>Send a bank transfer to Northwind Freight, reference INV-20418.</Text>
    </Stack>
  );
}
