import { useRef, useState } from 'react';

import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import { LoadingOverlay } from '@slotted/react/loading-overlay';

export default function LoadingOverlayPage() {
  const [closing, setClosing] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const close = () => {
    setClosing(true);
    timer.current = window.setTimeout(() => setClosing(false), 4000);
  };
  const stop = () => {
    window.clearTimeout(timer.current);
    setClosing(false);
  };

  return (
    <>
      <Inline>
        <Button onClick={close}>Close March period</Button>
      </Inline>
      <LoadingOverlay
        cancellable
        description="Keep this tab open."
        loading={closing}
        messages={{ label: 'Closing the accounting period' }}
        onCancel={stop}
        scope="page"
      />
    </>
  );
}
