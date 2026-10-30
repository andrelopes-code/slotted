import { useState } from 'react';
import {
  Combobox,
  ComboboxContent,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
} from '@slotted/react/combobox';
import { Glyph, Icon } from '@slotted/react/icon';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const CUSTOMERS = [
  { id: 'brightline', name: 'Brightline Studio', city: 'Portland, OR' },
  { id: 'harbor-pine', name: 'Harbor & Pine', city: 'Seattle, WA' },
  { id: 'northgate', name: 'Northgate Labs', city: 'Austin, TX' },
];
const ORDERS = [
  { id: '10482', customer: 'Brightline Studio', total: '$1,284.00' },
  { id: '10479', customer: 'Atlas Freight', total: '$356.40' },
  { id: '10471', customer: 'Northgate Labs', total: '$2,910.15' },
];
const LABELS = new Map<string, string>([
  ...CUSTOMERS.map((customer) => [`customer:${customer.id}`, customer.name] as const),
  ...ORDERS.map((order) => [`order:${order.id}`, `Order ${order.id}`] as const),
]);

export default function ComboboxGlobalSearch() {
  const [opened, setOpened] = useState<string | null>(null);

  return (
    <Stack gap={3}>
      <Combobox openOn="focus" size="sm" onValueChange={setOpened}>
        <ComboboxInput aria-label="Search Northwind" placeholder="Search customers and orders" />
        <ComboboxContent aria-label="Search Northwind">
          <ComboboxGroup label="Customers">
            {CUSTOMERS.map((customer) => (
              <ComboboxItem
                key={customer.id}
                value={`customer:${customer.id}`}
                description={customer.city}
                icon={
                  <Icon>
                    <Glyph name="person" />
                  </Icon>
                }
              >
                {customer.name}
              </ComboboxItem>
            ))}
          </ComboboxGroup>
          <ComboboxGroup label="Orders">
            {ORDERS.map((order) => (
              <ComboboxItem
                key={order.id}
                value={`order:${order.id}`}
                description={`${order.customer} · ${order.total}`}
                icon={
                  <Icon>
                    <Glyph name="file-text" />
                  </Icon>
                }
              >
                {`Order ${order.id}`}
              </ComboboxItem>
            ))}
          </ComboboxGroup>
        </ComboboxContent>
      </Combobox>
      <Text size="sm" tone="muted">
        {opened === null ? 'Focus the field to see every result.' : `Opening ${LABELS.get(opened)}`}
      </Text>
    </Stack>
  );
}
