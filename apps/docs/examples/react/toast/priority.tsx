import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import { createToaster, ToastRegion } from '@slotted/react/toast';

/* A queue for this example. The shared `toast` serves the whole application. */
const toaster = createToaster();

export default function ToastPriority() {
  return (
    <>
      <ToastRegion toaster={toaster} />
      <Inline gap={2}>
        <Button variant="outline" onClick={() => toaster.show({ title: 'Draft saved' })}>
          Polite
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toaster.show({
              title: 'Connection lost',
              description: 'Changes are kept on this device.',
              tone: 'danger',
              priority: 'assertive',
            })
          }
        >
          Assertive
        </Button>
      </Inline>
    </>
  );
}
