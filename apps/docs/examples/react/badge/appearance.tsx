import { Badge } from '@slotted/react/badge';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';

const VARIANTS = ['solid', 'soft', 'outline'] as const;
const TONES = [
  { tone: 'accent', label: 'Accent' },
  { tone: 'secondary', label: 'Secondary' },
  { tone: 'info', label: 'Info' },
  { tone: 'success', label: 'Success' },
  { tone: 'warning', label: 'Warning' },
  { tone: 'danger', label: 'Danger' },
] as const;

export default function BadgeAppearance() {
  return (
    <Stack gap={3}>
      {VARIANTS.map((variant) => (
        <Inline key={variant} gap={2}>
          {TONES.map(({ tone, label }) => (
            <Badge key={tone} tone={tone} variant={variant}>
              {label}
            </Badge>
          ))}
        </Inline>
      ))}
    </Stack>
  );
}
