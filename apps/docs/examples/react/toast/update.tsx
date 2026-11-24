import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import { createToaster, ToastRegion } from '@slotted/react/toast';

/* A queue for this example. The shared `toast` serves the whole application. */
const toaster = createToaster();

export default function ToastUpdate() {
  return (
    <>
      <ToastRegion toaster={toaster} />
      <Inline gap={2}>
        <Button
          onClick={() =>
            toaster.show({ id: 'price-list', title: 'Uploading price list', duration: 0 })
          }
        >
          Upload the price list
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toaster.show({
              id: 'price-list',
              title: 'Price list uploaded',
              tone: 'success',
              duration: 5000,
            })
          }
        >
          Finish
        </Button>
      </Inline>
    </>
  );
}
