import { useState } from 'react';

import { Button } from '@slotted/react/button';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListItem,
  DescriptionListTerm,
} from '@slotted/react/description-list';
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
import { Field, FieldLabel } from '@slotted/react/field';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Textarea } from '@slotted/react/textarea';

const DETAILS = [
  { term: 'Customer', value: 'Contoso Foods, Seattle' },
  { term: 'Items', value: '14 cases, 3 products' },
  { term: 'Warehouse', value: 'Reno, NV' },
];

export default function DrawerPin() {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);

  return (
    <Drawer mode={pinned ? 'inline' : 'overlay'} open={open} onOpenChange={setOpen} size="sm">
      <Stack gap={3}>
        <Inline>
          <DrawerTrigger
            render={(props) => (
              <Button {...props} size="sm" tone="secondary" variant="outline">
                Notes
              </Button>
            )}
          />
        </Inline>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            minBlockSize: '18rem',
            border: '1px solid var(--slotted-border-subtle)',
            borderRadius: 'var(--slotted-radius-lg)',
            overflow: 'hidden',
          }}
        >
          <div style={{ flex: '1 1 12rem', padding: 'var(--slotted-space-6)' }}>
            <DescriptionList>
              {DETAILS.map((detail) => (
                <DescriptionListItem key={detail.term}>
                  <DescriptionListTerm>{detail.term}</DescriptionListTerm>
                  <DescriptionListDescription>{detail.value}</DescriptionListDescription>
                </DescriptionListItem>
              ))}
            </DescriptionList>
          </div>
          <DrawerPanel>
            <DrawerHeader>
              <DrawerTitle>Notes on SO-1182</DrawerTitle>
              <DrawerClose />
            </DrawerHeader>
            <DrawerBody>
              <Field>
                <FieldLabel>Note for the warehouse</FieldLabel>
                <Textarea placeholder="Pallet height, dock number, contact on site" />
              </Field>
            </DrawerBody>
            <DrawerFooter>
              <Button
                size="sm"
                tone="secondary"
                variant="outline"
                onClick={() => setPinned(!pinned)}
              >
                {pinned ? 'Unpin' : 'Pin beside the order'}
              </Button>
            </DrawerFooter>
          </DrawerPanel>
        </div>
      </Stack>
    </Drawer>
  );
}
