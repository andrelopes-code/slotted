import { Button } from '@slotted/react/button';
import { Card, CardBody, CardHeader } from '@slotted/react/card';
import { Divider } from '@slotted/react/divider';
import { Stack } from '@slotted/react/stack';
import { Heading } from '@slotted/react/typography';

const CARRIERS = ['Northwind Freight', 'Harbor Line', 'Alpine Express'];

export default function DividerInset() {
  return (
    <Stack gap={4}>
      {[false, true].map((inset) => (
        <Card key={String(inset)}>
          <CardHeader>
            <Heading level={2} size="sm">
              {inset ? 'inset' : 'Full length'}
            </Heading>
          </CardHeader>
          <CardBody>
            <Stack gap={2}>
              {CARRIERS.map((carrier, index) => [
                index > 0 && <Divider inset={inset} key={`rule-${carrier}`} />,
                <Button fullWidth justify="between" key={carrier} tone="secondary" variant="ghost">
                  {carrier}
                </Button>,
              ])}
            </Stack>
          </CardBody>
        </Card>
      ))}
    </Stack>
  );
}
