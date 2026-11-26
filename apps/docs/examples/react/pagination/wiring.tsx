import { Button } from '@slotted/react/button';
import {
  Pagination,
  PaginationItems,
  PaginationNext,
  PaginationPrevious,
  usePagination,
} from '@slotted/react/pagination';

function BackToStart() {
  const { goToPage } = usePagination();

  return <Button onClick={() => goToPage(1)}>Back to page 1</Button>;
}

export default function PaginationWiring() {
  return (
    <Pagination aria-label="Invoices" count={482} defaultPage={12}>
      <PaginationPrevious />
      <PaginationItems />
      <PaginationNext />
      <BackToStart />
    </Pagination>
  );
}
