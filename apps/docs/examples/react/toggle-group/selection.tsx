import { Stack } from '@slotted/react/stack';
import { ToggleGroup, ToggleGroupItem } from '@slotted/react/toggle-group';
import { Text } from '@slotted/react/typography';

export default function ToggleGroupSelection() {
  return (
    <Stack gap={5}>
      <Stack gap={2}>
        <Text size="sm" tone="muted">
          One at a time, and none when the active item is pressed again
        </Text>
        <ToggleGroup aria-label="Shipping speed" defaultValue={['standard']}>
          <ToggleGroupItem value="standard">Standard</ToggleGroupItem>
          <ToggleGroupItem value="express">Express</ToggleGroupItem>
          <ToggleGroupItem value="overnight">Overnight</ToggleGroupItem>
        </ToggleGroup>
      </Stack>
      <Stack gap={2}>
        <Text size="sm" tone="muted">
          Several at once
        </Text>
        <ToggleGroup aria-label="Order channels" defaultValue={['web', 'retail']} multiple>
          <ToggleGroupItem value="web">Web</ToggleGroupItem>
          <ToggleGroupItem value="retail">Retail</ToggleGroupItem>
          <ToggleGroupItem value="wholesale">Wholesale</ToggleGroupItem>
        </ToggleGroup>
      </Stack>
      <Stack gap={2}>
        <Text size="sm" tone="muted">
          One at a time, always one
        </Text>
        <ToggleGroup aria-label="Reporting currency" defaultValue={['usd']} deselectable={false}>
          <ToggleGroupItem value="usd">USD</ToggleGroupItem>
          <ToggleGroupItem value="eur">EUR</ToggleGroupItem>
          <ToggleGroupItem value="gbp">GBP</ToggleGroupItem>
        </ToggleGroup>
      </Stack>
    </Stack>
  );
}
