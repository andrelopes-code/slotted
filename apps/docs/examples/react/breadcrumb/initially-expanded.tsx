import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from '@slotted/react/breadcrumb';

const LEVELS = ['Northwind', 'Finance', 'Receivables', 'EMEA', 'Germany', 'Invoices'];

export default function BreadcrumbInitiallyExpanded() {
  return (
    <Breadcrumb defaultExpanded maxItems={4}>
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
