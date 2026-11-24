import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import { createToaster, ToastRegion } from '@slotted/react/toast';

/* A queue for this example. The shared `toast` serves the whole application. */
const toaster = createToaster();

export default function ToastKeyboard() {
  return (
    <>
      <ToastRegion toaster={toaster} hotkey="Alt+N" />
      <Inline gap={2}>
        <Button
          onClick={() =>
            toaster.show({
              title: 'Draft saved',
              description: 'Press Alt+N to reach this message.',
              duration: 0,
            })
          }
        >
          Show a message
        </Button>
      </Inline>
    </>
  );
}
