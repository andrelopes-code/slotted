import { Card, CardBody } from '@slotted/react/card';
import { Divider } from '@slotted/react/divider';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

const FIGURES = [
  { label: 'Orders', value: '1,284' },
  { label: 'Revenue', value: '$48,200' },
  { label: 'Returns', value: '2.1%' },
];

export default function DividerValues() {
  return (
    <Card>
      <CardBody>
        <Inline gap={6}>
          {FIGURES.flatMap((figure, index) => [
            index > 0 ? (
              <Divider decorative key={`rule-${figure.label}`} orientation="vertical" />
            ) : null,
            <Stack gap={1} key={figure.label}>
              <Text size="sm" tone="muted">
                {figure.label}
              </Text>
              <Text numeric="tabular" size="3xl" weight="semibold">
                {figure.value}
              </Text>
            </Stack>,
          ])}
        </Inline>
      </CardBody>
    </Card>
  );
}
