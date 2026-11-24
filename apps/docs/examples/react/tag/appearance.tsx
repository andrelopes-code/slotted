import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Tag } from '@slotted/react/tag';

const VARIANTS = ['solid', 'soft', 'outline', 'dashed'] as const;
const TONES = [
  { tone: 'accent', label: 'Accent' },
  { tone: 'secondary', label: 'Secondary' },
  { tone: 'info', label: 'Info' },
  { tone: 'success', label: 'Success' },
  { tone: 'warning', label: 'Warning' },
  { tone: 'danger', label: 'Danger' },
] as const;

export default function TagAppearance() {
  return (
    <Stack gap={3}>
      {VARIANTS.map((variant) => (
        <Inline key={variant} gap={2}>
          {TONES.map(({ tone, label }) => (
            <Tag key={tone} tone={tone} variant={variant}>
              {label}
            </Tag>
          ))}
        </Inline>
      ))}
    </Stack>
  );
}
