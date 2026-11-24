import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import { createToaster, ToastRegion } from '@slotted/react/toast';

/* A queue for this example. The shared `toast` serves the whole application. */
const toaster = createToaster();

export default function ToastTones() {
  return (
    <>
      <ToastRegion toaster={toaster} />
      <Inline gap={2}>
        <Button
          variant="outline"
          onClick={() => toaster.show({ title: 'Nightly sync starts at 02:00', tone: 'info' })}
        >
          Info
        </Button>
        <Button
          variant="outline"
          onClick={() => toaster.show({ title: 'Invoice INV-2041 sent', tone: 'success' })}
        >
          Success
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toaster.show({ title: 'Stock of BEV-104 is below 20 units', tone: 'warning' })
          }
        >
          Warning
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toaster.show({ title: 'Payment for SO-10482 was declined', tone: 'danger' })
          }
        >
          Danger
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toaster.show({ title: 'Columns restored to their defaults', tone: 'secondary' })
          }
        >
          Note
        </Button>
      </Inline>
    </>
  );
}
