import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import { createToaster, ToastRegion } from '@slotted/react/toast';

const LABELS = ['SO-10482', 'SO-10483', 'SO-10484', 'SO-10485', 'SO-10486'];
/* A queue for this example. The shared `toast` serves the whole application. */
const toaster = createToaster();

export default function ToastQueue() {
  return (
    <>
      <ToastRegion toaster={toaster} limit={2} />
      <Inline gap={2}>
        <Button
          onClick={() => LABELS.forEach((label) => toaster.show({ title: `${label} printed` }))}
        >
          Print five labels
        </Button>
        <Button variant="outline" onClick={() => toaster.clear()}>
          Clear
        </Button>
      </Inline>
    </>
  );
}
