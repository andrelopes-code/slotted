import { Stack } from '@slotted/react/stack';
import { ToggleGroup, ToggleGroupItem } from '@slotted/react/toggle-group';
import { Text } from '@slotted/react/typography';

export default function ToggleGroupLayout() {
  return (
    <Stack gap={5}>
      <Stack gap={2}>
        <Text size="sm" tone="muted">
          fullWidth
        </Text>
        <ToggleGroup aria-label="Billing cycle" defaultValue={['monthly']} fullWidth>
          <ToggleGroupItem value="monthly">Monthly</ToggleGroupItem>
          <ToggleGroupItem value="yearly">Yearly</ToggleGroupItem>
        </ToggleGroup>
      </Stack>
      <Stack gap={2}>
        <Text size="sm" tone="muted">
          attached off
        </Text>
        <ToggleGroup
          aria-label="Order status filter"
          attached={false}
          defaultValue={['open']}
          multiple
        >
          <ToggleGroupItem value="open">Open</ToggleGroupItem>
          <ToggleGroupItem value="packed">Packed</ToggleGroupItem>
          <ToggleGroupItem value="shipped">Shipped</ToggleGroupItem>
        </ToggleGroup>
      </Stack>
      <Stack gap={2}>
        <Text size="sm" tone="muted">
          vertical
        </Text>
        <ToggleGroup aria-label="Warehouse zone" defaultValue={['storage']} orientation="vertical">
          <ToggleGroupItem value="receiving">Receiving</ToggleGroupItem>
          <ToggleGroupItem value="storage">Storage</ToggleGroupItem>
          <ToggleGroupItem value="dispatch">Dispatch</ToggleGroupItem>
        </ToggleGroup>
      </Stack>
    </Stack>
  );
}
