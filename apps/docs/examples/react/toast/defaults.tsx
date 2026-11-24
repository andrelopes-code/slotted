import { Button } from '@slotted/react/button';
import { createToaster, ToastDefaultsProvider, ToastRegion } from '@slotted/react/toast';

/* A queue for this example. The shared `toast` serves the whole application. */
const toaster = createToaster();

export default function ToastDefaultsExample() {
  return (
    <ToastDefaultsProvider duration={0} placement="top-end" variant="soft">
      <ToastRegion toaster={toaster} />
      <Button onClick={() => toaster.show({ title: 'Order SO-10482 packed', tone: 'success' })}>
        Pack order
      </Button>
    </ToastDefaultsProvider>
  );
}
