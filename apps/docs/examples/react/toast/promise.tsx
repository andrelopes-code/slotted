import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import { createToaster, ToastRegion } from '@slotted/react/toast';

function publish(succeeds: boolean) {
  return new Promise<number>((resolve, reject) => {
    setTimeout(() => (succeeds ? resolve(148) : reject(new Error('Offline'))), 2000);
  });
}

const MESSAGES = {
  loading: { title: 'Publishing prices' },
  success: (count: number) => ({ title: `${count} prices published`, tone: 'success' as const }),
  error: { title: 'Prices were not published', tone: 'danger' as const },
};

/* A queue for this example. The shared `toast` serves the whole application. */
const toaster = createToaster();

export default function ToastPromise() {
  return (
    <>
      <ToastRegion toaster={toaster} />
      <Inline gap={2}>
        <Button onClick={() => void toaster.promise(publish(true), MESSAGES)}>
          Publish prices
        </Button>
        <Button
          variant="outline"
          onClick={() => toaster.promise(publish(false), MESSAGES).catch(() => undefined)}
        >
          Publish with an error
        </Button>
      </Inline>
    </>
  );
}
