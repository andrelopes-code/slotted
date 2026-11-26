import {
  Pagination,
  PaginationItems,
  PaginationNext,
  PaginationPrevious,
} from '@slotted/react/pagination';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function PaginationStates() {
  return (
    <Stack gap={4}>
      <Text size="sm" tone="muted">
        At the last page
      </Text>
      <Pagination aria-label="Invoices, last page" count={482} defaultPage={25}>
        <PaginationPrevious />
        <PaginationItems />
        <PaginationNext />
      </Pagination>
      <Text size="sm" tone="muted">
        Loading the next page
      </Text>
      <Pagination aria-label="Invoices, loading" count={482} defaultPage={3} loading>
        <PaginationPrevious />
        <PaginationItems />
        <PaginationNext />
      </Pagination>
      <Text size="sm" tone="muted">
        Disabled
      </Text>
      <Pagination aria-label="Invoices, disabled" count={482} defaultPage={3} disabled>
        <PaginationPrevious />
        <PaginationItems />
        <PaginationNext />
      </Pagination>
    </Stack>
  );
}
