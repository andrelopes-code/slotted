import { Avatar } from '@slotted/react/avatar';
import type { AvatarSurface } from '@slotted/react/avatar';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const LOGO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cpath d='M8 52V12h8l32 28V12h8v40h-8L16 24v28Z' fill='%23111827'/%3E%3C/svg%3E";
const SURFACES: AvatarSurface[] = ['tone', 'none', 'plate'];

export default function AvatarSurfaceExample() {
  return (
    <Inline gap={6}>
      {SURFACES.map((surface) => (
        <Stack gap={2} key={surface}>
          <Avatar name="Nordic Freight" shape="square" size="lg" src={LOGO} surface={surface} />
          <Text size="sm" tone="muted">
            {surface}
          </Text>
        </Stack>
      ))}
    </Inline>
  );
}
