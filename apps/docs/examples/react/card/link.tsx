import { Card, CardBody, CardFooter, CardHeader, CardLink } from '@slotted/react/card';
import { Link } from '@slotted/react/link';
import { Heading, Text } from '@slotted/react/typography';

export default function CardLinkExample() {
  return (
    <Card>
      <CardHeader>
        <CardLink href="#meridian">
          <Heading level={2} size="md">
            Meridian Packaging
          </Heading>
        </CardLink>
        <Text size="sm" tone="muted">
          Supplier since 2019
        </Text>
      </CardHeader>
      <CardBody>
        <Text>12 open invoices totaling $31,460.00.</Text>
      </CardBody>
      <CardFooter>
        <Link href="#meridian-terms">Payment terms</Link>
      </CardFooter>
    </Card>
  );
}
