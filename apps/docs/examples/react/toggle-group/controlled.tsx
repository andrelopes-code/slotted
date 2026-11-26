import { useState } from 'react';

import { Stack } from '@slotted/react/stack';
import { ToggleGroup, ToggleGroupItem } from '@slotted/react/toggle-group';
import { Text } from '@slotted/react/typography';

const LIMIT = 3;

export default function ToggleGroupControlled() {
  const [columns, setColumns] = useState<readonly string[]>(['sku', 'quantity']);

  return (
    <Stack gap={3}>
      <ToggleGroup
        aria-label="Visible columns"
        multiple
        onValueChange={(value, request) => {
          if (value.length > LIMIT) request.cancel();
          else setColumns(value);
        }}
        value={columns}
      >
        <ToggleGroupItem value="sku">SKU</ToggleGroupItem>
        <ToggleGroupItem value="quantity">Quantity</ToggleGroupItem>
        <ToggleGroupItem value="location">Location</ToggleGroupItem>
        <ToggleGroupItem value="supplier">Supplier</ToggleGroupItem>
      </ToggleGroup>
      <Text size="sm" tone="muted">
        {columns.length} of {LIMIT} columns: {columns.join(', ') || 'none'}
      </Text>
    </Stack>
  );
}
