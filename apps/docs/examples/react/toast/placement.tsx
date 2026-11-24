import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import { createToaster, ToastRegion } from '@slotted/react/toast';

/* A queue for this example. The shared `toast` serves the whole application. */
const toaster = createToaster();

export default function ToastPlacement() {
  return (
    <>
      <ToastRegion toaster={toaster} placement="top" />
      <Inline gap={2}>
        <Button onClick={() => toaster.show({ title: 'Draft saved' })}>Show at the top</Button>
      </Inline>
    </>
  );
}
