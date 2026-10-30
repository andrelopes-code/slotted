import { Button } from '@slotted/react/button';
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerDefaultsProvider,
  DrawerHeader,
  DrawerPanel,
  DrawerTitle,
  DrawerTrigger,
} from '@slotted/react/drawer';
import { Inline } from '@slotted/react/inline';
import { Text } from '@slotted/react/typography';

export default function DrawerDefaults() {
  return (
    <DrawerDefaultsProvider side="start" size="sm">
      <Inline gap={2}>
        <Drawer>
          <DrawerTrigger
            render={(props) => (
              <Button {...props} tone="secondary" variant="outline">
                Warehouses
              </Button>
            )}
          />
          <DrawerPanel>
            <DrawerHeader>
              <DrawerTitle>Warehouses</DrawerTitle>
              <DrawerClose />
            </DrawerHeader>
            <DrawerBody>
              <Text size="sm">From the start edge and small, both from the provider.</Text>
            </DrawerBody>
          </DrawerPanel>
        </Drawer>
        <Drawer size="lg">
          <DrawerTrigger
            render={(props) => (
              <Button {...props} tone="secondary" variant="outline">
                Carriers
              </Button>
            )}
          />
          <DrawerPanel>
            <DrawerHeader>
              <DrawerTitle>Carriers</DrawerTitle>
              <DrawerClose />
            </DrawerHeader>
            <DrawerBody>
              <Text size="sm">
                From the start edge, from the provider, and large because this drawer says so.
              </Text>
            </DrawerBody>
          </DrawerPanel>
        </Drawer>
      </Inline>
    </DrawerDefaultsProvider>
  );
}
