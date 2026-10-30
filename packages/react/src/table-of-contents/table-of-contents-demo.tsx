import type { ReactNode } from 'react';

import { Prose } from '../prose';
import { Section, SectionBody, SectionHeader, SectionHeading, SectionTitle } from '../section';
import { Stack } from '../stack';
import { Text } from '../typography';
import type { TableOfContentsItemData } from './table-of-contents.types';

/**
 * One product, three documents. The customer record is the screen an
 * operations platform opens a hundred times a day — sections with headings a
 * bar under the title jumps between. The returns policy is an article the
 * support team reads: prose, with headings the list is generated from. The
 * supplier contract is numbered clauses, which is what `numbered` exists for.
 */

export const CUSTOMER_ITEMS: TableOfContentsItemData[] = [
  { id: 'dados-gerais', label: 'Dados gerais' },
  {
    id: 'enderecos',
    label: 'Addresses',
    children: [
      { id: 'billing', label: 'Billing' },
      { id: 'shipping', label: 'Shipping' },
    ],
  },
  { id: 'contactos', label: 'Contactos' },
  {
    id: 'condicoes',
    label: 'Commercial terms',
    children: [
      { id: 'prazos', label: 'Payment terms' },
      { id: 'limite', label: 'Credit limit' },
    ],
  },
  { id: 'invoices', label: 'Invoices' },
  { id: 'support', label: 'Support' },
];

const CUSTOMER_TEXT: Record<string, string[]> = {
  'dados-gerais': [
    'Aurora Distributors LLC · EIN 50-9384112 · customer since March 2019. Segment: grocery retail, 14 stores in the Portland metro area.',
    'Account manager: Rachel Sullivan. Last order on September 12, 2026, 38 lines, delivered on time.',
  ],
  enderecos: [
    'Two active addresses. Billing and shipping have differed since the warehouse move in 2024.',
  ],
  faturacao: [
    '412 Almada Street, Suite 3 · Portland, OR 97204. Electronic invoice via EDI, sent to the accounting office.',
  ],
  shipping: [
    'Central warehouse, Industrial Park, lot 27 · Beaverton, OR 97005. Receiving Monday to Friday, 7 AM to 3 PM; dock 3 for pallets.',
  ],
  contactos: [
    'Purchasing: Joan Ferris, +1 503 555 0142. Finance: Noah Baptiste, invoices@aurora-dist.com. Warehouse receiving: Charles Pierce, ext. 214.',
  ],
  condicoes: ['Terms negotiated in January 2026, valid until the annual review.'],
  prazos: [
    'Payment 45 days after the invoice date, by bank transfer. 1.5% discount for payment within 10 days.',
  ],
  limite: [
    'Credit limit of $180,000.00. Current exposure of $112,430.80. Three invoices not yet due, none overdue.',
  ],
  invoices: [
    'INV 2026/4471 · 09/12/2026 · $38,412.60 · not yet due. INV 2026/4302 · 08/28/2026 · $41,905.00 · not yet due. INV 2026/4187 · 08/14/2026 · $32,113.20 · not yet due.',
    'INV 2026/4020 · 07/31/2026 · $29,870.00 · paid on 09/09/2026.',
  ],
  suporte: [
    'Two open requests: replacement of 6 boxes damaged in the 09/12 delivery; request for a duplicate copy of invoice INV 2026/4187.',
  ],
};

function paragraphs(id: string): ReactNode {
  return (CUSTOMER_TEXT[id] ?? []).map((text) => (
    <Text key={text} size="sm">
      {text}
    </Text>
  ));
}

/** The customer record's sections, each with the id its link points at. */
export function CustomerSections({ sticky = false }: { sticky?: boolean }) {
  return (
    <Stack gap={8}>
      {CUSTOMER_ITEMS.map((item) => (
        <Section id={item.id} key={item.id} sticky={sticky}>
          <SectionHeader>
            <SectionTitle>
              <SectionHeading>{item.label}</SectionHeading>
            </SectionTitle>
          </SectionHeader>
          <SectionBody>
            <Stack gap={6}>{paragraphs(item.id)}</Stack>
            {item.children?.map((child) => (
              <Section id={child.id} key={child.id}>
                <SectionHeader>
                  <SectionTitle>
                    <SectionHeading>{child.label}</SectionHeading>
                  </SectionTitle>
                </SectionHeader>
                <SectionBody>{paragraphs(child.id)}</SectionBody>
              </Section>
            ))}
          </SectionBody>
        </Section>
      ))}
    </Stack>
  );
}

/** The returns policy, as prose whose headings the list is read from. */
export function PolicyArticle() {
  return (
    <Prose>
      <h1>Returns and refunds policy</h1>
      <p>
        This policy applies to all goods sold by Nexora to business customers and replaces the 2024
        version. Deadlines are counted from the receipt date recorded on the proof of delivery.
      </p>
      <h2>Scope</h2>
      <p>
        It covers catalog products, made-to-order items, and invoiced samples. It does not cover
        installation services, which have their own terms in the service agreement.
      </p>
      <h2>Return deadlines</h2>
      <p>
        The general deadline is 30 days after receipt. Products with an expiry date, a cold chain,
        or sealed packaging have shorter deadlines, described below.
      </p>
      <h3>Perishables</h3>
      <p>
        Refrigerated or frozen goods are only accepted if the claim is opened on the day of delivery
        and the temperature recorded at the dock is outside the contracted range.
      </p>
      <h3>Sealed packaging</h3>
      <p>
        An opened package loses the right to return for withdrawal, but not for defect. The defect
        assessment is carried out at the warehouse within five business days.
      </p>
      <h2>Condition of the goods</h2>
      <p>
        Returned goods must arrive with the original label and a legible lot number. Boxes
        repackaged by the customer are accepted when the lot is traceable.
      </p>
      <h2>Refunds</h2>
      <p>
        The refund is issued as a credit note against the original invoice and offset on the next
        invoice, or paid by bank transfer at the customer’s request within 15 days.
      </p>
      <h3>Pickup costs</h3>
      <p>
        Pickup is free when the return results from a shipping error or a defect. For returns by
        withdrawal, the pickup cost is deducted from the refund.
      </p>
      <h2>Exceptions</h2>
      <p>
        Discontinued products, products customized with the customer’s brand, or products bought in
        a clearance campaign cannot be returned by withdrawal.
      </p>
    </Prose>
  );
}

export const CONTRACT_ITEMS: TableOfContentsItemData[] = [
  { id: 'objeto', label: 'Objeto do contrato' },
  {
    id: 'fornecimento',
    label: 'Fornecimento',
    children: [
      { id: 'orders', label: 'Orders' },
      { id: 'deliveries', label: 'Deliveries and deadlines' },
      { id: 'returns', label: 'Returns' },
    ],
  },
  {
    id: 'precos',
    label: 'Pricing and payment',
    children: [
      { id: 'revisao', label: 'Price review' },
      { id: 'faturacao-contrato', label: 'Billing' },
    ],
  },
  { id: 'vigencia', label: 'Term and termination' },
  { id: 'foro', label: 'Jurisdiction' },
];

const CONTRACT_TEXT: Record<string, string> = {
  objeto:
    'This agreement governs the ongoing supply of corrugated cardboard packaging by Riverside Packaging Inc. to Nexora, in the quantities and specifications of annex I.',
  fornecimento:
    'The supplier undertakes to keep in stock, at all times, the equivalent of four weeks of average consumption.',
  orders:
    'Orders are issued by electronic purchase order and are considered accepted if not refused within 24 hours.',
  deliveries:
    'The delivery deadline is five business days. A delay of more than three business days gives rise to a penalty of 0.5% per day on the line value.',
  returns:
    'Non-conforming goods are returned at the expense of the supplier, who replaces them within ten business days.',
  precos: 'The prices in annex II are fixed for twelve months from signing.',
  revisao:
    'After the initial period, prices may be reviewed annually by the change in the paper price index published by CEPI.',
  'faturacao-contrato':
    'Billing is monthly, due in 60 days. Invoices without a purchase order number are returned.',
  vigencia:
    'The agreement runs for 24 months and renews for equal periods unless terminated with 90 days of advance notice.',
  foro: 'For all matters arising from this agreement, the courts of King County have jurisdiction, waiving any other.',
};

/** The supplier contract, clause by clause, numbered by the list. */
export function ContractClauses() {
  return (
    <Stack gap={8}>
      {CONTRACT_ITEMS.map((clause, index) => (
        <Section id={clause.id} key={clause.id}>
          <SectionHeader>
            <SectionTitle>
              <SectionHeading>
                {index + 1}. {clause.label}
              </SectionHeading>
            </SectionTitle>
          </SectionHeader>
          <SectionBody>
            <Text size="sm">{CONTRACT_TEXT[clause.id]}</Text>
            {clause.children?.map((sub, subIndex) => (
              <Section id={sub.id} key={sub.id}>
                <SectionHeader>
                  <SectionTitle>
                    <SectionHeading>
                      {index + 1}.{subIndex + 1}. {sub.label}
                    </SectionHeading>
                  </SectionTitle>
                </SectionHeader>
                <SectionBody>
                  <Text size="sm">{CONTRACT_TEXT[sub.id]}</Text>
                </SectionBody>
              </Section>
            ))}
          </SectionBody>
        </Section>
      ))}
    </Stack>
  );
}

/** A column beside a document: the list in the region, the document in the body. */
export function Workspace({
  aside,
  children,
  size = 'screen',
}: {
  aside: ReactNode;
  children: ReactNode;
  size?: 'screen' | 'tall';
}) {
  return (
    <div className="slotted-demo-viewport" data-size={size}>
      <div className="slotted-demo-workspace">
        <div className="slotted-demo-workspace__region">{aside}</div>
        <div className="slotted-demo-workspace__body">{children}</div>
      </div>
    </div>
  );
}
