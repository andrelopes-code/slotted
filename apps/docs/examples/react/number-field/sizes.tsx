import { NumberField } from '@slotted/react/number-field';
import { Stack } from '@slotted/react/stack';

export default function NumberFieldSizes() {
  return (
    <Stack gap={4}>
      <NumberField aria-label="Units per case" defaultValue={24} min={1} size="sm" />
      <NumberField aria-label="Cases ordered" defaultValue={12} min={1} size="md" />
      <NumberField aria-label="Pallets ordered" defaultValue={2} min={1} size="lg" />
    </Stack>
  );
}
