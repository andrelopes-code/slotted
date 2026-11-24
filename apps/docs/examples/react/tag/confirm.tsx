import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Tag, TagGroup } from '@slotted/react/tag';
import type { TagRemoveReason, TagRemoveRequest } from '@slotted/react/tag';
import { Text } from '@slotted/react/typography';
import { useState } from 'react';

export default function TagConfirm() {
  const [reason, setReason] = useState<TagRemoveReason | null>(null);
  const [removed, setRemoved] = useState(false);

  const via = reason === 'keyboard' ? 'Backspace or Delete' : 'the remove control';

  function handleRemove(request: TagRemoveRequest) {
    request.cancel();
    setReason(request.reason);
  }

  function handleConfirm() {
    setRemoved(true);
    setReason(null);
  }

  return (
    <Stack gap={3}>
      <TagGroup aria-label="Environments of the release rule">
        {!removed && (
          <Tag onRemove={handleRemove} tone="danger" variant="outline">
            Production
          </Tag>
        )}
        <Tag>Staging</Tag>
      </TagGroup>

      {reason !== null && (
        <Stack gap={2}>
          <Text size="sm">Remove Production from this rule? Requested with {via}.</Text>
          <Inline gap={2}>
            <Button onClick={handleConfirm}>Remove</Button>
            <Button onClick={() => setReason(null)} variant="outline">
              Keep
            </Button>
          </Inline>
        </Stack>
      )}
    </Stack>
  );
}
