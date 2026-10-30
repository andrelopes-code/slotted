import { useState } from 'react';

import { Button } from '@slotted/react/button';
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
  DrawerResizer,
  DrawerTitle,
  DrawerTrigger,
} from '@slotted/react/drawer';
import { FieldGroup, FieldGroupContent, FieldGroupLegend } from '@slotted/react/field-group';
import { Inline } from '@slotted/react/inline';
import { Radio, RadioGroup } from '@slotted/react/radio-group';
import { Text } from '@slotted/react/typography';

const WINDOWS = [
  { value: 'morning', label: 'Thursday 8 October, 8 AM to noon' },
  { value: 'afternoon', label: 'Thursday 8 October, 1 to 5 PM' },
  { value: 'friday', label: 'Friday 9 October, 8 AM to noon' },
];

export default function DrawerSheet() {
  const [open, setOpen] = useState(false);
  const [pickup, setPickup] = useState('morning');
  const [draft, setDraft] = useState(pickup);

  return (
    <Inline align="center" gap={3}>
      <Text size="sm">Pickup: {WINDOWS.find((window) => window.value === pickup)?.label}</Text>
      <Drawer
        open={open}
        onOpenChange={(next) => {
          if (next) setDraft(pickup);
          setOpen(next);
        }}
        side="bottom"
      >
        <DrawerTrigger
          render={(props) => (
            <Button {...props} size="sm" tone="secondary" variant="outline">
              Reschedule
            </Button>
          )}
        />
        <DrawerPanel>
          <DrawerResizer />
          <DrawerHeader>
            <DrawerTitle>Reschedule pickup</DrawerTitle>
            <DrawerDescription>Shipment SH-4471, UPS Ground from Reno, NV.</DrawerDescription>
            <DrawerClose />
          </DrawerHeader>
          <DrawerBody>
            <FieldGroup>
              <FieldGroupLegend>Pickup window</FieldGroupLegend>
              <FieldGroupContent>
                <RadioGroup value={draft} onValueChange={setDraft}>
                  {WINDOWS.map((window) => (
                    <Radio key={window.value} value={window.value}>
                      {window.label}
                    </Radio>
                  ))}
                </RadioGroup>
              </FieldGroupContent>
            </FieldGroup>
          </DrawerBody>
          <DrawerFooter>
            <Button variant="ghost" tone="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setPickup(draft);
                setOpen(false);
              }}
            >
              Reschedule
            </Button>
          </DrawerFooter>
        </DrawerPanel>
      </Drawer>
    </Inline>
  );
}
