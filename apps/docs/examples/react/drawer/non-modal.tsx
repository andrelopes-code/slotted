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
  DrawerDescription,
  DrawerHeader,
  DrawerPanel,
  DrawerTitle,
  DrawerTrigger,
} from '@slotted/react/drawer';
import { Field, FieldDescription, FieldLabel } from '@slotted/react/field';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { TextField } from '@slotted/react/text-field';

const RATES = [
  { term: 'UPS Ground', value: '$38.40, 3 business days' },
  { term: 'FedEx Home Delivery', value: '$41.15, 3 business days' },
  { term: 'UPS 2nd Day Air', value: '$96.80, 2 business days' },
  { term: 'FedEx Priority Overnight', value: '$184.25, next business day' },
];

export default function DrawerNonModal() {
  return (
    <Stack gap={4}>
      <Field>
        <FieldLabel>Shipping charge</FieldLabel>
        <TextField inputMode="decimal" placeholder="0.00" />
        <FieldDescription>Charged to Contoso Foods on invoice INV-2041.</FieldDescription>
      </Field>
      <Inline>
        <Drawer modal={false} outsidePress="none" scrimFrom={1} size="sm">
          <DrawerTrigger
            render={(props) => (
              <Button {...props} size="sm" tone="secondary" variant="outline">
                Show carrier rates
              </Button>
            )}
          />
          <DrawerPanel>
            <DrawerHeader>
              <DrawerTitle>Carrier rates</DrawerTitle>
              <DrawerDescription>3 packages, 18.4 kg, Reno to Seattle.</DrawerDescription>
              <DrawerClose />
            </DrawerHeader>
            <DrawerBody>
              <DescriptionList>
                {RATES.map((rate) => (
                  <DescriptionListItem key={rate.term}>
                    <DescriptionListTerm>{rate.term}</DescriptionListTerm>
                    <DescriptionListDescription>{rate.value}</DescriptionListDescription>
                  </DescriptionListItem>
                ))}
              </DescriptionList>
            </DrawerBody>
          </DrawerPanel>
        </Drawer>
      </Inline>
    </Stack>
  );
}
