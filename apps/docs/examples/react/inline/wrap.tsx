import { Badge } from '@slotted/react/badge';
import { Card, CardBody, CardHeader } from '@slotted/react/card';
import { Inline } from '@slotted/react/inline';
import { Stack } from '@slotted/react/stack';
import { Heading } from '@slotted/react/typography';

const WRAPS = ['wrap', 'nowrap'] as const;
const LABELS = [
  'Wholesale',
  'Fragile',
  'Priority shipping',
  'Refrigerated',
  'Hazardous materials',
  'Signature required',
] as const;

export default function InlineWrap() {
  return (
    <Stack gap={4}>
      {WRAPS.map((wrap) => (
        <Card key={wrap}>
          <CardHeader>
            <Heading level={2} size="sm">
              wrap {wrap}
            </Heading>
          </CardHeader>
          <CardBody>
            <Inline gap={2} wrap={wrap}>
              {LABELS.map((label) => (
                <Badge key={label} tone="secondary" variant="outline">
                  {label}
                </Badge>
              ))}
            </Inline>
          </CardBody>
        </Card>
      ))}
    </Stack>
  );
}
