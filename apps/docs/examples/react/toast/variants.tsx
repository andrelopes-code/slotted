import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import { createToaster, ToastRegion } from '@slotted/react/toast';

/* A queue for this example. The shared `toast` serves the whole application. */
const toaster = createToaster();

export default function ToastVariants() {
  return (
    <>
      <ToastRegion toaster={toaster} />
      <Inline gap={2}>
        <Button
          variant="outline"
          onClick={() =>
            toaster.show({ title: 'Invoice INV-2041 sent', tone: 'success', variant: 'raised' })
          }
        >
          Raised
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toaster.show({ title: 'Invoice INV-2041 sent', tone: 'success', variant: 'soft' })
          }
        >
          Soft
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toaster.show({ title: 'Invoice INV-2041 sent', tone: 'success', variant: 'solid' })
          }
        >
          Solid
        </Button>
      </Inline>
    </>
  );
}
