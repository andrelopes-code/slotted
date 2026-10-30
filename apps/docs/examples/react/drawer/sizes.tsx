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

const SIZES = [
  { size: 'sm', body: '18rem. One field or a short list, such as the carrier for a shipment.' },
  { size: 'md', body: '24rem, the default. The details of an order or a short form.' },
  { size: 'lg', body: '30rem. A record with a table of lines, such as the items of an order.' },
  { size: 'xl', body: '40rem. Two columns, such as a customer and their open orders.' },
  { size: 'full', body: 'The whole screen. A task that needs every column, such as a pick list.' },
] as const;

export default function DrawerSizes() {
  return (
    <Inline gap={2}>
      {SIZES.map((item) => (
        <Drawer key={item.size} size={item.size}>
          <DrawerTrigger
            render={(props) => (
              <Button {...props} tone="secondary" variant="outline">
                {item.size}
              </Button>
            )}
          />
          <DrawerPanel>
            <DrawerHeader>
              <DrawerTitle>Shipment SH-4471</DrawerTitle>
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
