import { useState } from 'react';

import { Button } from '@slotted/react/button';
import { Inline } from '@slotted/react/inline';
import {
  Pagination,
  PaginationItems,
  PaginationNext,
  PaginationPrevious,
  type PaginationPageRequest,
} from '@slotted/react/pagination';
import { Stack } from '@slotted/react/stack';
import { Text } from '@slotted/react/typography';

export default function PaginationControlled() {
  const [count, setCount] = useState(482);
  const [page, setPage] = useState(25);
  const [reason, setReason] = useState('none yet');

  const handlePageChange = (next: number, request: PaginationPageRequest) => {
    setPage(next);
    setReason(request.reason);
  };

  return (
    <Stack gap={4}>
      <Pagination aria-label="Invoices" count={count} page={page} onPageChange={handlePageChange}>
        <PaginationPrevious />
        <PaginationItems />
        <PaginationNext />
      </Pagination>
      <Text size="sm" tone="muted">
        {count} invoices, page {page}. Last change: {reason}.
      </Text>
      <Inline>
        <Button onClick={() => setCount(96)}>Show open invoices</Button>
        <Button onClick={() => setCount(482)}>Show all invoices</Button>
      </Inline>
    </Stack>
  );
}
