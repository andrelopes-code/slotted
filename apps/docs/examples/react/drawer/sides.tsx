import { Button } from '@slotted/react/button';
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerHeader,
  DrawerPanel,
  DrawerTitle,
  DrawerTrigger,
} from '@slotted/react/drawer';
import { Inline } from '@slotted/react/inline';
import { Text } from '@slotted/react/typography';

const SIDES = [
  {
    side: 'start',
    label: 'Start',
    title: 'Warehouses',
    body: 'Reno, Columbus and Savannah. A panel from the start edge suits navigation between sites.',
  },
  {
    side: 'end',
    label: 'End',
    title: 'Order SO-1182',
    body: 'Contoso Foods, 14 cases. The end edge is the default and suits the details of a row.',
  },
  {
    side: 'top',
    label: 'Top',
    title: 'Carrier notice',
    body: 'UPS pickups from Reno run two hours late today. A panel from the top suits a notice that belongs to the whole screen.',
  },
  {
    side: 'bottom',
    label: 'Bottom',
    title: '3 orders selected',
    body: 'SO-1182, SO-1183 and SO-1184. A sheet from the bottom suits actions on a phone, within reach of the thumb.',
  },
] as const;

export default function DrawerSides() {
  return (
    <Inline gap={2}>
      {SIDES.map((item) => (
        <Drawer key={item.side} side={item.side}>
          <DrawerTrigger
            render={(props) => (
              <Button {...props} tone="secondary" variant="outline">
                {item.label}
              </Button>
            )}
          />
          <DrawerPanel>
            <DrawerHeader>
              <DrawerTitle>{item.title}</DrawerTitle>
              <DrawerClose />
            </DrawerHeader>
            <DrawerBody>
              <Text size="sm">{item.body}</Text>
            </DrawerBody>
          </DrawerPanel>
        </Drawer>
      ))}
    </Inline>
  );
}
