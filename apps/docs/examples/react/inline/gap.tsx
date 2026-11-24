import { Avatar } from '@slotted/react/avatar';
import { Grid } from '@slotted/react/grid';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const GAPS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
const PEOPLE = ['Maria Chen', 'Tomas Reyes', 'Priya Nair'] as const;

export default function InlineGap() {
  return (
    <Grid columns={2} gap={5} minItemWidth="sm">
      {GAPS.map((gap) => (
        <Stack key={gap} gap={1}>
          <Text size="xs" tone="muted">
            Gap {gap}
          </Text>
          <Inline gap={gap}>
            {PEOPLE.map((person) => (
              <Avatar key={person} name={person} size="sm" />
            ))}
          </Inline>
        </Stack>
      ))}
    </Grid>
  );
}
