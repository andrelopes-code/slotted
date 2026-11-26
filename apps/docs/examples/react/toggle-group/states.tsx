import { Stack } from '@slotted/react/stack';
import { ToggleGroup, ToggleGroupItem } from '@slotted/react/toggle-group';
import { Text } from '@slotted/react/typography';

export default function ToggleGroupStates() {
  return (
    <Stack gap={5}>
      <Stack gap={2}>
        <Text size="sm" tone="muted">
          One item unavailable
        </Text>
        <ToggleGroup aria-label="Export format" defaultValue={['csv']}>
          <ToggleGroupItem value="csv">CSV</ToggleGroupItem>
          <ToggleGroupItem disabled value="xlsx">
            XLSX
          </ToggleGroupItem>
          <ToggleGroupItem value="pdf">PDF</ToggleGroupItem>
        </ToggleGroup>
      </Stack>
      <Stack gap={2}>
        <Text size="sm" tone="muted">
          Unavailable while on
        </Text>
        <ToggleGroup aria-label="Invoice status" defaultValue={['approved']}>
          <ToggleGroupItem value="draft">Draft</ToggleGroupItem>
          <ToggleGroupItem disabled value="approved">
            Approved
          </ToggleGroupItem>
          <ToggleGroupItem value="paid">Paid</ToggleGroupItem>
        </ToggleGroup>
      </Stack>
      <Stack gap={2}>
        <Text size="sm" tone="muted">
          Whole group unavailable
        </Text>
        <ToggleGroup aria-label="Payment terms" defaultValue={['net30']} disabled>
          <ToggleGroupItem value="net15">Net 15</ToggleGroupItem>
          <ToggleGroupItem value="net30">Net 30</ToggleGroupItem>
          <ToggleGroupItem value="net60">Net 60</ToggleGroupItem>
        </ToggleGroup>
      </Stack>
    </Stack>
  );
}
