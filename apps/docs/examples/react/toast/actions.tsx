import { useState } from 'react';
import { Button } from '@slotted/react/button';
import { Stack } from '@slotted/react/stack';
import { createToaster, ToastRegion } from '@slotted/react/toast';
import { Text } from '@slotted/react/typography';

/* A queue for this example. The shared `toast` serves the whole application. */
const toaster = createToaster();

export default function ToastActionsExample() {
  const [archived, setArchived] = useState(false);

  function handleArchive() {
    setArchived(true);
    const id = toaster.show({
      title: 'Order SO-10482 archived',
      actions: (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setArchived(false);
            toaster.dismiss(id);
          }}
        >
          Undo
        </Button>
      ),
    });
  }

  return (
    <Stack align="start" gap={3}>
      <ToastRegion toaster={toaster} />
      <Button disabled={archived} onClick={handleArchive}>
        Archive order
      </Button>
      <Text size="sm" tone="muted">
        {archived ? 'SO-10482 is archived.' : 'SO-10482 is open.'}
      </Text>
    </Stack>
  );
}
