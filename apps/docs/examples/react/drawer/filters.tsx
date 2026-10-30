import { useState } from 'react';

import { Button } from '@slotted/react/button';
import { Checkbox } from '@slotted/react/checkbox';
import { CheckboxGroup } from '@slotted/react/checkbox-group';
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
  DrawerTitle,
  DrawerTrigger,
} from '@slotted/react/drawer';
import { FieldGroup, FieldGroupContent, FieldGroupLegend } from '@slotted/react/field-group';
import { Inline } from '@slotted/react/inline';
import { Radio, RadioGroup } from '@slotted/react/radio-group';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const ORDERS = [
  { id: 'SO-1182', status: 'processing', warehouse: 'RNO' },
  { id: 'SO-1183', status: 'shipped', warehouse: 'CMH' },
  { id: 'SO-1184', status: 'on-hold', warehouse: 'RNO' },
  { id: 'SO-1185', status: 'processing', warehouse: 'SAV' },
  { id: 'SO-1186', status: 'shipped', warehouse: 'RNO' },
  { id: 'SO-1187', status: 'processing', warehouse: 'CMH' },
  { id: 'SO-1188', status: 'on-hold', warehouse: 'SAV' },
  { id: 'SO-1189', status: 'processing', warehouse: 'RNO' },
];

interface Filters {
  statuses: readonly string[];
  warehouse: string;
}

const ALL: Filters = { statuses: ['processing', 'shipped', 'on-hold'], warehouse: 'any' };

const matching = (filters: Filters) =>
  ORDERS.filter(
    (order) =>
      filters.statuses.includes(order.status) &&
      (filters.warehouse === 'any' || order.warehouse === filters.warehouse),
  ).length;

export default function DrawerFilters() {
  const [open, setOpen] = useState(false);
  const [applied, setApplied] = useState<Filters>(ALL);
  const [draft, setDraft] = useState<Filters>(applied);
  const count = matching(draft);

  return (
    <Inline align="center" gap={3}>
      <Text size="sm">
        {matching(applied)} of {ORDERS.length} orders
      </Text>
      <Drawer
        open={open}
        onOpenChange={(next) => {
          if (next) setDraft(applied);
          setOpen(next);
        }}
        size="sm"
      >
        <DrawerTrigger
          render={(props) => (
            <Button {...props} size="sm" tone="secondary" variant="outline">
              Filters
            </Button>
          )}
        />
        <DrawerPanel>
          <DrawerHeader>
            <DrawerTitle>Filter orders</DrawerTitle>
            <DrawerClose />
          </DrawerHeader>
          <DrawerBody>
            <Stack gap={6}>
              <FieldGroup>
                <FieldGroupLegend>Status</FieldGroupLegend>
                <FieldGroupContent>
                  <CheckboxGroup
                    value={draft.statuses}
                    onValueChange={(statuses) => setDraft({ ...draft, statuses })}
                  >
                    <Checkbox value="processing">Processing</Checkbox>
                    <Checkbox value="shipped">Shipped</Checkbox>
                    <Checkbox value="on-hold">On hold</Checkbox>
                  </CheckboxGroup>
                </FieldGroupContent>
              </FieldGroup>
              <FieldGroup>
                <FieldGroupLegend>Warehouse</FieldGroupLegend>
                <FieldGroupContent>
                  <RadioGroup
                    value={draft.warehouse}
                    onValueChange={(warehouse) => setDraft({ ...draft, warehouse })}
                  >
                    <Radio value="any">Any warehouse</Radio>
                    <Radio value="RNO">Reno, NV</Radio>
                    <Radio value="CMH">Columbus, OH</Radio>
                    <Radio value="SAV">Savannah, GA</Radio>
                  </RadioGroup>
                </FieldGroupContent>
              </FieldGroup>
            </Stack>
          </DrawerBody>
          <DrawerFooter>
            <Button variant="ghost" tone="secondary" onClick={() => setDraft(ALL)}>
              Reset
            </Button>
            <Button
              onClick={() => {
                setApplied(draft);
                setOpen(false);
              }}
            >
              Show {count} orders
            </Button>
          </DrawerFooter>
        </DrawerPanel>
      </Drawer>
    </Inline>
  );
}
