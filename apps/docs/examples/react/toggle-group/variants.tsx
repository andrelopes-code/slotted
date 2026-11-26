import { Stack } from '@slotted/react/stack';
import { ToggleGroup, ToggleGroupItem } from '@slotted/react/toggle-group';
import { Text } from '@slotted/react/typography';

export default function ToggleGroupVariants() {
  return (
    <Stack gap={5}>
      <Stack gap={2}>
        <Text size="sm" tone="muted">
          outline
        </Text>
        <ToggleGroup aria-label="Table density" defaultValue={['compact']} variant="outline">
          <ToggleGroupItem value="comfortable">Comfortable</ToggleGroupItem>
          <ToggleGroupItem value="compact">Compact</ToggleGroupItem>
        </ToggleGroup>
      </Stack>
      <Stack gap={2}>
        <Text size="sm" tone="muted">
          ghost
        </Text>
        <ToggleGroup aria-label="Row height" defaultValue={['compact']} variant="ghost">
          <ToggleGroupItem value="comfortable">Comfortable</ToggleGroupItem>
          <ToggleGroupItem value="compact">Compact</ToggleGroupItem>
        </ToggleGroup>
      </Stack>
      <Stack gap={2}>
        <Text size="sm" tone="muted">
          chips
        </Text>
        <ToggleGroup
          aria-label="Product categories"
          defaultValue={['packaging', 'pallets']}
          multiple
          variant="chips"
        >
          <ToggleGroupItem value="hardware">Hardware</ToggleGroupItem>
          <ToggleGroupItem value="packaging">Packaging</ToggleGroupItem>
          <ToggleGroupItem value="pallets">Pallets</ToggleGroupItem>
          <ToggleGroupItem value="labels">Labels</ToggleGroupItem>
          <ToggleGroupItem value="safety">Safety gear</ToggleGroupItem>
          <ToggleGroupItem value="cleaning">Cleaning</ToggleGroupItem>
        </ToggleGroup>
      </Stack>
    </Stack>
  );
}
