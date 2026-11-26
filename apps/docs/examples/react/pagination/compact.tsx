import { Card, CardBody, CardHeader } from '@slotted/react/card';
import { Grid } from '@slotted/react/grid';
import {
  Pagination,
  PaginationItems,
  PaginationNext,
  PaginationPrevious,
} from '@slotted/react/pagination';
import { Heading } from '@slotted/react/typography';

export default function PaginationCompact() {
  return (
    <Grid columns={3} gap={4} minItemWidth="xs">
      <Card>
        <CardHeader>
          <Heading level={2} size="md">
            Receiving
          </Heading>
        </CardHeader>
        <CardBody>
          <Pagination aria-label="Receiving queue" count={140} defaultPage={3}>
            <PaginationPrevious />
            <PaginationItems />
            <PaginationNext />
          </Pagination>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <Heading level={2} size="md">
            Picking
          </Heading>
        </CardHeader>
        <CardBody>
          <Pagination aria-label="Picking queue" count={482} defaultPage={12}>
            <PaginationPrevious />
            <PaginationItems />
            <PaginationNext />
          </Pagination>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <Heading level={2} size="md">
            Packing
          </Heading>
        </CardHeader>
        <CardBody>
          <Pagination aria-label="Packing queue" count={96} defaultPage={2}>
            <PaginationPrevious />
            <PaginationItems />
            <PaginationNext />
          </Pagination>
        </CardBody>
      </Card>
    </Grid>
  );
}
