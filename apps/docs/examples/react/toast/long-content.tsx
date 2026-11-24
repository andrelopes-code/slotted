import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import { createToaster, ToastRegion } from '@slotted/react/toast';

/* A queue for this example. The shared `toast` serves the whole application. */
const toaster = createToaster();

export default function ToastLongContent() {
  return (
    <>
      <ToastRegion toaster={toaster} />
      <Inline gap={2}>
        <Button
          onClick={() =>
            toaster.show({
              title: 'Deployment of the storefront rejected by the registry',
              description:
                'sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
              tone: 'danger',
              duration: 0,
            })
          }
        >
          Show a long message
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toaster.show({ title: 'Columns restored to their defaults', hideIcon: true })
          }
        >
          Without a mark
        </Button>
      </Inline>
    </>
  );
}
