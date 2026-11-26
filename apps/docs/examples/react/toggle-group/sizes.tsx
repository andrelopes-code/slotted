import { Stack } from '@slotted/react/stack';
import { ToggleGroup, ToggleGroupItem } from '@slotted/react/toggle-group';
import { Text } from '@slotted/react/typography';

export default function ToggleGroupSizes() {
  return (
    <Stack gap={5}>
      <Stack gap={2}>
        <Text size="sm" tone="muted">
          sm
        </Text>
        <ToggleGroup aria-label="Order sorting, small" defaultValue={['newest']} size="sm">
          <ToggleGroupItem value="newest">Newest</ToggleGroupItem>
          <ToggleGroupItem value="oldest">Oldest</ToggleGroupItem>
          <ToggleGroupItem value="largest">Largest</ToggleGroupItem>
        </ToggleGroup>
      </Stack>
      <Stack gap={2}>
        <Text size="sm" tone="muted">
          md
        </Text>
        <ToggleGroup aria-label="Order sorting, medium" defaultValue={['newest']} size="md">
          <ToggleGroupItem value="newest">Newest</ToggleGroupItem>
          <ToggleGroupItem value="oldest">Oldest</ToggleGroupItem>
          <ToggleGroupItem value="largest">Largest</ToggleGroupItem>
        </ToggleGroup>
      </Stack>
      <Stack gap={2}>
        <Text size="sm" tone="muted">
          lg
        </Text>
        <ToggleGroup aria-label="Order sorting, large" defaultValue={['newest']} size="lg">
          <ToggleGroupItem value="newest">Newest</ToggleGroupItem>
          <ToggleGroupItem value="oldest">Oldest</ToggleGroupItem>
          <ToggleGroupItem value="largest">Largest</ToggleGroupItem>
        </ToggleGroup>
      </Stack>
    </Stack>
  );
}
