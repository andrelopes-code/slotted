import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import { createToaster, ToastRegion } from '@slotted/react/toast';

/* A queue for this example. The shared `toast` serves the whole application. */
const toaster = createToaster();

export default function ToastDuration() {
  return (
    <>
      <ToastRegion toaster={toaster} />
      <Inline gap={2}>
        <Button
          variant="outline"
          onClick={() =>
            toaster.show({
              title: 'Export ready',
              description: 'orders-november.csv',
              duration: 8000,
              progress: true,
            })
          }
        >
          Eight seconds
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toaster.show({
              title: 'Your session has expired',
              description: 'Sign in again to go on.',
              tone: 'danger',
              duration: 0,
            })
          }
        >
          Until dismissed
        </Button>
      </Inline>
    </>
  );
}
