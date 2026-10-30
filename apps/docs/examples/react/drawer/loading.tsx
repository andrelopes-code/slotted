import { useEffect, useState } from 'react';

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
import { Skeleton, SkeletonRegion } from '@slotted/react/skeleton';

interface Shipment {
  carrier: string;
  tracking: string;
  packages: string;
  delivery: string;
}

const FIELDS: { key: keyof Shipment; term: string; width: string }[] = [
  { key: 'carrier', term: 'Carrier', width: '6rem' },
  { key: 'tracking', term: 'Tracking number', width: '11rem' },
  { key: 'packages', term: 'Packages', width: '8rem' },
  { key: 'delivery', term: 'Estimated delivery', width: '9rem' },
];

export default function DrawerLoading() {
  const [open, setOpen] = useState(false);
  const [shipment, setShipment] = useState<Shipment | null>(null);

  useEffect(() => {
    if (!open) return;
    setShipment(null);
    const timer = setTimeout(
      () =>
        setShipment({
          carrier: 'UPS Ground',
          tracking: '1Z 999 AA1 01 2345 6784',
          packages: '3, 18.4 kg in total',
          delivery: 'Thursday, 8 October',
        }),
      1200,
    );
    return () => clearTimeout(timer);
  }, [open]);

  return (
    <Drawer open={open} onOpenChange={setOpen} loading={shipment === null}>
      <DrawerTrigger
        render={(props) => (
          <Button {...props} tone="secondary" variant="outline">
            Track shipment SH-4471
          </Button>
        )}
      />
      <DrawerPanel>
        <DrawerHeader>
          <DrawerTitle>Shipment SH-4471</DrawerTitle>
          <DrawerDescription>Order SO-1182 for Contoso Foods, Seattle.</DrawerDescription>
          <DrawerClose />
        </DrawerHeader>
        <DrawerBody>
          <SkeletonRegion
            delay={200}
            loading={shipment === null}
            messages={{ label: 'Loading shipment' }}
            minDuration={400}
          >
            <DescriptionList>
              {FIELDS.map((field) => (
                <DescriptionListItem key={field.key}>
                  <DescriptionListTerm>{field.term}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {shipment === null ? (
                      <Skeleton inlineSize={field.width} />
                    ) : (
                      shipment[field.key]
                    )}
                  </DescriptionListDescription>
                </DescriptionListItem>
              ))}
            </DescriptionList>
          </SkeletonRegion>
        </DrawerBody>
      </DrawerPanel>
    </Drawer>
  );
}
