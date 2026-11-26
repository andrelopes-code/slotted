import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from '@slotted/react/breadcrumb';

const LEVELS = ['Northwind', 'Finance', 'Receivables', 'EMEA', 'Germany', 'Invoices'];

export default function BreadcrumbMessages() {
  return (
    <Breadcrumb
      maxItems={4}
      messages={{ label: 'Where this invoice sits', showHidden: 'Reveal {count} more levels' }}
    >
      <BreadcrumbList>
        {LEVELS.map((level) => (
          <BreadcrumbItem key={level}>
            <BreadcrumbLink href="#">{level}</BreadcrumbLink>
          </BreadcrumbItem>
        ))}
        <BreadcrumbItem>
          <BreadcrumbPage>INV-2026-08-0041</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
