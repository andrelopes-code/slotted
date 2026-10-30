import { useState } from 'react';
import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Tab, TabList, TabPanel, Tabs } from '@slotted/react/tabs';
import { Text } from '@slotted/react/typography';

const VIEWS = [
  { value: 'orders', label: 'Orders', panel: '12 open orders, $14,380.00 in total.' },
  {
    value: 'invoices',
    label: 'Invoices',
    panel: 'INV-20877 and INV-20902 are past due: $2,146.50.',
  },
  { value: 'payments', label: 'Payments', panel: 'Last payment: $3,200.00 on September 30.' },
];

export default function TabsControlled() {
  const [view, setView] = useState('orders');

  return (
    <Stack gap={5}>
      <Inline gap={3} align="center" justify="between">
        <Text size="sm" tone="muted">
          2 invoices are past due.
        </Text>
        <Button size="sm" variant="outline" onClick={() => setView('invoices')}>
          Review invoices
        </Button>
      </Inline>
      <Tabs value={view} onValueChange={setView}>
        <TabList aria-label="Account Harbor & Pine">
          {VIEWS.map((item) => (
            <Tab key={item.value} value={item.value}>
              {item.label}
            </Tab>
          ))}
        </TabList>
        {VIEWS.map((item) => (
          <TabPanel key={item.value} value={item.value}>
            <Text size="sm">{item.panel}</Text>
          </TabPanel>
        ))}
      </Tabs>
    </Stack>
  );
}
