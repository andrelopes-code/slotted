import {
  Pagination,
  PaginationFirst,
  PaginationItems,
  PaginationLast,
  PaginationNext,
  PaginationPrevious,
} from '@slotted/react/pagination';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function PaginationRow() {
  return (
    <Stack gap={4}>
      <Text size="sm" tone="muted">
        One page on each side of the current page and at each end
      </Text>
      <Pagination aria-label="Invoices, default row" count={482} defaultPage={12}>
        <PaginationFirst />
        <PaginationPrevious />
        <PaginationItems />
        <PaginationNext />
        <PaginationLast />
      </Pagination>
      <Text size="sm" tone="muted">
        Two pages on each side of the current page and at each end
      </Text>
      <Pagination
        aria-label="Invoices, wide row"
        boundaryCount={2}
        count={482}
        defaultPage={12}
        siblingCount={2}
      >
        <PaginationFirst />
        <PaginationPrevious />
        <PaginationItems />
        <PaginationNext />
        <PaginationLast />
      </Pagination>
    </Stack>
  );
}
