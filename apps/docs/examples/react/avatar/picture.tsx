import { useState } from 'react';
import { Avatar } from '@slotted/react/avatar';
import type { AvatarStatus } from '@slotted/react/avatar';
import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const PORTRAIT =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23c7d2fe'/%3E%3Ccircle cx='32' cy='25' r='11' fill='%234338ca'/%3E%3Cpath d='M10 64a22 22 0 0 1 44 0Z' fill='%234338ca'/%3E%3C/svg%3E";
const UNREADABLE = 'data:image/png;base64,AAAA';

export default function AvatarPicture() {
  const [failed, setFailed] = useState(false);
  const [status, setStatus] = useState<AvatarStatus>('loading');

  return (
    <Stack gap={4}>
      <Avatar
        name="Maria Chen"
        onStatusChange={setStatus}
        size="xl"
        src={failed ? UNREADABLE : PORTRAIT}
      />
      <Text size="sm" tone="muted">
        Status: {status}
      </Text>
      <Inline>
        <Button onClick={() => setFailed(!failed)} tone="secondary" variant="outline">
          {failed ? 'Restore the picture' : 'Fail the request'}
        </Button>
      </Inline>
    </Stack>
  );
}
