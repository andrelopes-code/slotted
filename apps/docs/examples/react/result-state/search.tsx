import { useState } from 'react';

import { Button } from '@slotted/react/button';
import { Field, FieldLabel } from '@slotted/react/field';
import {
  ResultState,
  ResultStateActions,
  ResultStateContent,
  ResultStateDescription,
  ResultStateTitle,
} from '@slotted/react/result-state';
import { Stack } from '@slotted/react/stack';
import { TextField } from '@slotted/react/text-field';
import { Text } from '@slotted/react/typography';

const ORDERS = [
  { id: 'SO-10482', customer: 'Harbor & Pine' },
  { id: 'SO-10483', customer: 'Brightline Studio' },
  { id: 'SO-10484', customer: 'Northgate Labs' },
  { id: 'SO-10485', customer: 'Verde Kitchen' },
];

export default function ResultStateSearch() {
  const [query, setQuery] = useState('Contoso');
  const needle = query.trim().toLowerCase();
  const rows = ORDERS.filter((order) =>
    `${order.id} ${order.customer}`.toLowerCase().includes(needle),
  );

  return (
    <Stack gap={4}>
      <Field>
        <FieldLabel>Search orders</FieldLabel>
        <TextField onValueChange={setQuery} value={query} />
      </Field>
      {rows.length === 0 ? (
        <ResultState status="no-results">
          <ResultStateContent>
            <ResultStateTitle>No orders match this search</ResultStateTitle>
            <ResultStateDescription>
              Clear the search to see all {ORDERS.length} orders.
            </ResultStateDescription>
          </ResultStateContent>
          <ResultStateActions>
            <Button onClick={() => setQuery('')} variant="outline">
              Clear search
            </Button>
          </ResultStateActions>
        </ResultState>
      ) : (
        <Stack gap={2}>
          {rows.map((order) => (
            <Text key={order.id}>
              {order.id} · {order.customer}
            </Text>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
