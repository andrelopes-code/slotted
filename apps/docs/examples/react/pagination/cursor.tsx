import { useState } from 'react';

import {
  Pagination,
  PaginationNext,
  PaginationPrevious,
  PaginationStatus,
} from '@slotted/react/pagination';

export default function PaginationCursor() {
  const [page, setPage] = useState(1);

  return (
    <Pagination aria-label="Shipments" page={page} onPageChange={setPage}>
      <PaginationPrevious />
      <PaginationStatus>Shipments, page {page}</PaginationStatus>
      <PaginationNext />
    </Pagination>
  );
}
