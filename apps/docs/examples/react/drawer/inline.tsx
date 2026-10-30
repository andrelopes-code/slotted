import { useState } from 'react';

import { Badge } from '@slotted/react/badge';
import { Button } from '@slotted/react/button';
import { Checkbox } from '@slotted/react/checkbox';
import { CheckboxGroup } from '@slotted/react/checkbox-group';
import { Drawer, DrawerBody, DrawerPanel, DrawerTrigger } from '@slotted/react/drawer';
import { FieldGroup, FieldGroupContent, FieldGroupLegend } from '@slotted/react/field-group';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const STATUSES = [
  { value: 'processing', label: 'Processing', tone: 'accent' },
  { value: 'shipped', label: 'Shipped', tone: 'success' },
  { value: 'on-hold', label: 'On hold', tone: 'warning' },
] as const;

const ORDERS = [
  { id: 'SO-1182', customer: 'Contoso Foods', status: 'processing' },
  { id: 'SO-1183', customer: 'Fabrikam Grocers', status: 'shipped' },
  { id: 'SO-1184', customer: 'Tailspin Market', status: 'on-hold' },
  { id: 'SO-1185', customer: 'Adventure Works', status: 'processing' },
  { id: 'SO-1186', customer: 'Litware Deli', status: 'shipped' },
] as const;

export default function DrawerInline() {
  const [statuses, setStatuses] = useState<readonly string[]>(['processing', 'on-hold']);
  const shown = ORDERS.filter((order) => statuses.includes(order.status));

  return (
    <Drawer defaultOpen mode="inline" side="start" size="sm">
      <Stack gap={3}>
        <Inline>
          <DrawerTrigger
            render={(props) => (
              <Button {...props} size="sm" tone="secondary" variant="outline">
                Filters
              </Button>
            )}
          />
        </Inline>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            minBlockSize: '16rem',
            border: '1px solid var(--slotted-border-subtle)',
            borderRadius: 'var(--slotted-radius-lg)',
            overflow: 'hidden',
          }}
        >
          <DrawerPanel>
            <DrawerBody>
              <FieldGroup>
                <FieldGroupLegend>Status</FieldGroupLegend>
                <FieldGroupContent>
                  <CheckboxGroup value={statuses} onValueChange={setStatuses}>
                    {STATUSES.map((status) => (
                      <Checkbox key={status.value} value={status.value}>
                        {status.label}
                      </Checkbox>
                    ))}
                  </CheckboxGroup>
                </FieldGroupContent>
              </FieldGroup>
            </DrawerBody>
          </DrawerPanel>
          <Stack gap={3} style={{ flex: '1 1 12rem', padding: 'var(--slotted-space-6)' }}>
            <Text size="sm" tone="muted">
              {shown.length} of {ORDERS.length} orders
            </Text>
            {shown.map((order) => {
              const status = STATUSES.find((item) => item.value === order.status)!;
              return (
                <Inline key={order.id} align="center" gap={3} justify="between">
                  <Stack gap={0}>
                    <Text size="sm" weight="semibold">
                      {order.id}
                    </Text>
                    <Text size="sm" tone="muted">
                      {order.customer}
                    </Text>
                  </Stack>
                  <Badge tone={status.tone}>{status.label}</Badge>
                </Inline>
              );
            })}
          </Stack>
        </div>
      </Stack>
    </Drawer>
  );
}
