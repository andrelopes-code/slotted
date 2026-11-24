import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Tag } from '@slotted/react/tag';

const SIZES = [
  { size: 'sm', label: 'Small' },
  { size: 'md', label: 'Medium' },
  { size: 'lg', label: 'Large' },
] as const;
const SHAPES = ['pill', 'square'] as const;

export default function TagSizes() {
  return (
    <Stack gap={3}>
      {SHAPES.map((shape) => (
        <Inline key={shape} align="center" gap={2}>
          {SIZES.map(({ size, label }) => (
            <Tag key={size} shape={shape} size={size} tone="success">
              {label}
            </Tag>
          ))}
        </Inline>
      ))}
    </Stack>
  );
}
