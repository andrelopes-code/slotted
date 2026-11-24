import { Avatar } from '@slotted/react/avatar';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const PORTRAIT =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23c7d2fe'/%3E%3Ccircle cx='32' cy='25' r='11' fill='%234338ca'/%3E%3Cpath d='M10 64a22 22 0 0 1 44 0Z' fill='%234338ca'/%3E%3C/svg%3E";

const STATUSES = ['idle', 'loading', 'loaded', 'error'] as const;

export default function AvatarStatusExample() {
  return (
    <Inline gap={6}>
      {STATUSES.map((status) => (
        <Stack gap={2} key={status}>
          <Avatar name="Maria Chen" size="lg" src={PORTRAIT} status={status} />
          <Text size="sm" tone="muted">
            {status}
          </Text>
        </Stack>
      ))}
    </Inline>
  );
}
