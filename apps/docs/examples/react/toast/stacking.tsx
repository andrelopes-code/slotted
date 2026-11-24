import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import { createToaster, ToastRegion } from '@slotted/react/toast';

const SHIPMENTS = ['SH-2201', 'SH-2202', 'SH-2203', 'SH-2204'];
/* A queue for this example. The shared `toast` serves the whole application. */
const toaster = createToaster();

export default function ToastStacking() {
  return (
    <>
      <ToastRegion toaster={toaster} limit={4} stacking="stack" />
      <Inline gap={2}>
        <Button
          onClick={() =>
            SHIPMENTS.forEach((shipment) =>
              toaster.show({ title: `${shipment} received`, tone: 'success', duration: 0 }),
            )
          }
        >
          Receive four shipments
        </Button>
        <Button variant="outline" onClick={() => toaster.clear()}>
          Clear
        </Button>
      </Inline>
    </>
  );
}
