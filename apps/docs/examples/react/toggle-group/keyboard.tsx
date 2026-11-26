import { Stack } from '@slotted/react/stack';
import { ToggleGroup, ToggleGroupItem } from '@slotted/react/toggle-group';
import { Text } from '@slotted/react/typography';

export default function ToggleGroupKeyboard() {
  return (
    <Stack gap={5}>
      <Stack gap={2}>
        <Text size="sm" tone="muted">
          Arrows wrap at the ends
        </Text>
        <ToggleGroup aria-label="Pick window" defaultValue={['morning']}>
          <ToggleGroupItem value="morning">Morning</ToggleGroupItem>
          <ToggleGroupItem value="afternoon">Afternoon</ToggleGroupItem>
          <ToggleGroupItem value="night">Night</ToggleGroupItem>
        </ToggleGroup>
      </Stack>
      <Stack gap={2}>
        <Text size="sm" tone="muted">
          Arrows stop at the ends
        </Text>
        <ToggleGroup aria-label="Dock shift" defaultValue={['early']} loop={false}>
          <ToggleGroupItem value="early">Early</ToggleGroupItem>
          <ToggleGroupItem value="late">Late</ToggleGroupItem>
          <ToggleGroupItem value="overnight">Overnight</ToggleGroupItem>
        </ToggleGroup>
      </Stack>
    </Stack>
  );
}
