import { Stack } from '@slotted/react/stack';
import {
  ToggleGroup,
  ToggleGroupDefaultsProvider,
  ToggleGroupItem,
} from '@slotted/react/toggle-group';
import { Text } from '@slotted/react/typography';

export default function ToggleGroupDefaults() {
  return (
    <ToggleGroupDefaultsProvider size="sm" variant="ghost" deselectable={false}>
      <Stack gap={5}>
        <Stack gap={2}>
          <Text size="sm" tone="muted">
            Inherits the provider
          </Text>
          <ToggleGroup aria-label="Table density" defaultValue={['compact']}>
            <ToggleGroupItem value="comfortable">Comfortable</ToggleGroupItem>
            <ToggleGroupItem value="compact">Compact</ToggleGroupItem>
          </ToggleGroup>
        </Stack>
        <Stack gap={2}>
          <Text size="sm" tone="muted">
            States its own variant
          </Text>
          <ToggleGroup aria-label="Row height" defaultValue={['compact']} variant="outline">
            <ToggleGroupItem value="comfortable">Comfortable</ToggleGroupItem>
            <ToggleGroupItem value="compact">Compact</ToggleGroupItem>
          </ToggleGroup>
        </Stack>
      </Stack>
    </ToggleGroupDefaultsProvider>
  );
}
