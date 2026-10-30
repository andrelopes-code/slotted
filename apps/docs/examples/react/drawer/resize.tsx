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
  DrawerDescription,
  DrawerHeader,
  DrawerPanel,
  DrawerResizer,
  DrawerTitle,
  DrawerTrigger,
} from '@slotted/react/drawer';

const LINES = [
  { term: 'Arabica beans, 5 kg', value: '6 cases, $420.00' },
  { term: 'Oat milk, 12 × 1 L', value: '4 cases, $192.00' },
  { term: 'Paper cups, 16 oz, 1,000 per case', value: '4 cases, $628.00' },
];

export default function DrawerResize() {
  const [extent, setExtent] = useState<number | undefined>(undefined);
  const width = extent === undefined ? 'the md step' : `${Math.round(extent * 100)}% of the window`;

  return (
    <Drawer extent={extent} maxExtent={0.8} minExtent={0.25} onExtentChange={setExtent}>
      <DrawerTrigger
        render={(props) => (
          <Button {...props} tone="secondary" variant="outline">
            View order lines
          </Button>
        )}
      />
      <DrawerPanel>
        <DrawerHeader>
          <DrawerTitle>Order SO-1182 lines</DrawerTitle>
          <DrawerDescription>Width: {width}.</DrawerDescription>
          <DrawerClose />
        </DrawerHeader>
        <DrawerBody>
          <DescriptionList>
            {LINES.map((line) => (
              <DescriptionListItem key={line.term}>
                <DescriptionListTerm>{line.term}</DescriptionListTerm>
                <DescriptionListDescription>{line.value}</DescriptionListDescription>
              </DescriptionListItem>
            ))}
          </DescriptionList>
        </DrawerBody>
        <DrawerResizer />
      </DrawerPanel>
    </Drawer>
  );
}
