import { Avatar } from '@slotted/react/avatar';
import type { AvatarTone, AvatarVariant } from '@slotted/react/avatar';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const TONES: AvatarTone[] = ['accent', 'secondary', 'info', 'success', 'warning', 'danger'];
const VARIANTS: AvatarVariant[] = ['soft', 'solid'];

export default function AvatarTones() {
  return (
    <Stack gap={4}>
      {VARIANTS.map((variant) => (
        <Stack gap={2} key={variant}>
          <Text size="sm" tone="muted">
            {variant}
          </Text>
          <Inline gap={3}>
            {TONES.map((tone) => (
              <Avatar key={tone} name="Maria Chen" tone={tone} variant={variant} />
            ))}
          </Inline>
        </Stack>
      ))}
    </Stack>
  );
}
