import { useState } from 'react';
import { Button } from '@slotted/react/button';
import { Stack } from '@slotted/react/stack';
import { Tab, TabList, TabPanel, Tabs } from '@slotted/react/tabs';
import { Text } from '@slotted/react/typography';

const OPEN = [
  { id: 'SO-1187', customer: 'Harbor & Pine', total: '$1,240.00' },
  { id: 'SO-1188', customer: 'Brightline Studio', total: '$318.50' },
  { id: 'SO-1190', customer: 'Northgate Labs', total: '$2,906.10' },
  { id: 'SO-1191', customer: 'Verde Kitchen', total: '$86.00' },
];

export default function TabsDismissible() {
  const [orders, setOrders] = useState(OPEN);
  const [active, setActive] = useState('SO-1188');

  if (orders.length === 0) {
    return (
      <Stack gap={3} align="start">
        <Text size="sm" tone="muted">
          No orders open.
        </Text>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setOrders(OPEN);
            setActive('SO-1187');
          }}
        >
          Reopen orders
        </Button>
      </Stack>
    );
  }

  return (
    <Tabs
      value={active}
      onValueChange={setActive}
      onTabDismiss={(value) => setOrders((open) => open.filter((order) => order.id !== value))}
    >
      <TabList aria-label="Open orders">
        {orders.map((order) => (
          <Tab key={order.id} dismissible dismissLabel={`Close ${order.id}`} value={order.id}>
            {order.id}
          </Tab>
        ))}
      </TabList>
      {orders.map((order) => (
        <TabPanel key={order.id} value={order.id}>
          <Text size="sm">
            {order.customer}, {order.total}.
          </Text>
        </TabPanel>
      ))}
    </Tabs>
  );
}
