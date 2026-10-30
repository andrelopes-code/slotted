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
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';

const ORDER = [
  { term: 'Customer', value: 'Contoso Foods' },
  { term: 'Items', value: '14 cases, 3 products' },
  { term: 'Total', value: '$1,240.00' },
];

const CUSTOMER = [
  { term: 'Account', value: 'C-0042' },
  { term: 'Contact', value: 'Ana Ruiz, ap@contoso.com' },
  { term: 'Open orders', value: '3, $4,815.50 in total' },
  { term: 'Payment terms', value: 'Net 30' },
];

export default function DrawerNested() {
  return (
    <Drawer>
      <DrawerTrigger
        render={(props) => (
          <Button {...props} tone="secondary" variant="outline">
            View order SO-1182
          </Button>
        )}
      />
      <DrawerPanel>
        <DrawerHeader>
          <DrawerTitle>Order SO-1182</DrawerTitle>
          <DrawerDescription>Placed on 2 October 2026.</DrawerDescription>
          <DrawerClose />
        </DrawerHeader>
        <DrawerBody>
          <Stack gap={5}>
            <DescriptionList>
              {ORDER.map((detail) => (
                <DescriptionListItem key={detail.term}>
                  <DescriptionListTerm>{detail.term}</DescriptionListTerm>
                  <DescriptionListDescription>{detail.value}</DescriptionListDescription>
                </DescriptionListItem>
              ))}
            </DescriptionList>
            <Inline>
              <Drawer size="sm">
                <DrawerTrigger
                  render={(props) => (
                    <Button {...props} size="sm" tone="secondary" variant="outline">
                      View customer
                    </Button>
                  )}
                />
                <DrawerPanel>
                  <DrawerHeader>
                    <DrawerTitle>Contoso Foods</DrawerTitle>
                    <DrawerDescription>Customer since March 2021.</DrawerDescription>
                    <DrawerClose />
                  </DrawerHeader>
                  <DrawerBody>
                    <DescriptionList>
                      {CUSTOMER.map((detail) => (
                        <DescriptionListItem key={detail.term}>
                          <DescriptionListTerm>{detail.term}</DescriptionListTerm>
                          <DescriptionListDescription>{detail.value}</DescriptionListDescription>
                        </DescriptionListItem>
                      ))}
                    </DescriptionList>
                  </DrawerBody>
                </DrawerPanel>
              </Drawer>
            </Inline>
          </Stack>
        </DrawerBody>
      </DrawerPanel>
    </Drawer>
  );
}
