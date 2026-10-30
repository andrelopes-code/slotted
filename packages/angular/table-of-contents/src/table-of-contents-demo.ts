import { Component } from '@angular/core';
import { SlProse } from '@slotted/angular/prose';
import {
  SlSection,
  SlSectionBody,
  SlSectionHeader,
  SlSectionHeading,
  SlSectionTitle,
} from '@slotted/angular/section';
import { SlStack } from '@slotted/angular/stack';
import { SlHeading, SlText } from '@slotted/angular/typography';

import type { TableOfContentsItemData } from './table-of-contents-defaults';

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
      { id: 'delivery', label: 'Delivery' },
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

const SECTION_PARTS = [
  SlSection,
  SlSectionBody,
  SlSectionHeader,
  SlSectionHeading,
  SlSectionTitle,
  SlStack,
  SlText,
];

/**
 * The customer record's sections, written out with static ids the way a
 * hand-written page gives them: `slSection` reads its id as a host attribute.
 */
@Component({
  selector: 'sl-toc-customer-demo',
  standalone: true,
  imports: SECTION_PARTS,
  template: `
    <div slStack [gap]="8">
      <section slSection id="dados-gerais">
        <div slSectionHeader>
          <div slSectionTitle><h2 slSectionHeading>Dados gerais</h2></div>
        </div>
        <div slSectionBody>
          <div slStack [gap]="6">
            <p slText size="sm">
              Aurora Distribution Inc. · EIN 12-3456789 · customer since March 2019. Segment:
              grocery retail, 14 stores in the Portland area.
            </p>
            <p slText size="sm">
              Account manager: Rita Sanders. Last order on September 12, 2026, 38 lines, delivered
              on time.
            </p>
          </div>
        </div>
      </section>
      <section slSection id="enderecos">
        <div slSectionHeader>
          <div slSectionTitle><h2 slSectionHeading>Addresses</h2></div>
        </div>
        <div slSectionBody>
          <div slStack [gap]="6">
            <p slText size="sm">
              Two active addresses. Billing and delivery have differed since the warehouse move in
              2024.
            </p>
          </div>
          <section slSection id="faturacao">
            <div slSectionHeader>
              <div slSectionTitle><h3 slSectionHeading>Billing</h3></div>
            </div>
            <div slSectionBody>
              <p slText size="sm">
                412 Main Street, Floor 3 · Portland, OR 97204. Electronic invoice by PDF, sent to
                the accounting firm.
              </p>
            </div>
          </section>
          <section slSection id="delivery">
            <div slSectionHeader>
              <div slSectionTitle><h3 slSectionHeading>Delivery</h3></div>
            </div>
            <div slSectionBody>
              <p slText size="sm">
                Central warehouse, Harbor Industrial Park, lot 27 · Portland, OR 97210. Receiving
                Monday to Friday, 7 AM to 3 PM; dock 3 for pallets.
              </p>
            </div>
          </section>
        </div>
      </section>
      <section slSection id="contactos">
        <div slSectionHeader>
          <div slSectionTitle><h2 slSectionHeading>Contactos</h2></div>
        </div>
        <div slSectionBody>
          <div slStack [gap]="6">
            <p slText size="sm">
              Purchasing: Joan Ferris, +1 503 555 0142. Finance: Noah Baptist,
              invoices&#64;aurora-dist.com. Warehouse receiving: Charles Pine, ext. 214.
            </p>
          </div>
        </div>
      </section>
      <section slSection id="condicoes">
        <div slSectionHeader>
          <div slSectionTitle><h2 slSectionHeading>Commercial terms</h2></div>
        </div>
        <div slSectionBody>
          <div slStack [gap]="6">
            <p slText size="sm">Terms negotiated in January 2026, valid until annual review.</p>
          </div>
          <section slSection id="payment-terms">
            <div slSectionHeader>
              <div slSectionTitle><h3 slSectionHeading>Payment terms</h3></div>
            </div>
            <div slSectionBody>
              <p slText size="sm">
                Payment 45 days after the invoice date, by ACH transfer. 1.5% discount for payment
                within 10 days.
              </p>
            </div>
          </section>
          <section slSection id="limite">
            <div slSectionHeader>
              <div slSectionTitle><h3 slSectionHeading>Credit limit</h3></div>
            </div>
            <div slSectionBody>
              <p slText size="sm">
                Credit limit of $180,000.00. Current exposure of $112,430.80. Three invoices not yet
                due, none overdue.
              </p>
            </div>
          </section>
        </div>
      </section>
      <section slSection id="invoices">
        <div slSectionHeader>
          <div slSectionTitle><h2 slSectionHeading>Invoices</h2></div>
        </div>
        <div slSectionBody>
          <div slStack [gap]="6">
            <p slText size="sm">
              FT 2026/4471 · 12/09/2026 · 38 412,60 € · por vencer. FT 2026/4302 · 28/08/2026 · 41
              905,00 € · por vencer. FT 2026/4187 · 14/08/2026 · 32 113,20 € · por vencer.
            </p>
            <p slText size="sm">FT 2026/4020 · 31/07/2026 · 29 870,00 € · paga em 09/09/2026.</p>
          </div>
        </div>
      </section>
      <section slSection id="suporte">
        <div slSectionHeader>
          <div slSectionTitle><h2 slSectionHeading>Suporte</h2></div>
        </div>
        <div slSectionBody>
          <div slStack [gap]="6">
            <p slText size="sm">
              Two open requests: replacement of 6 boxes damaged in the 09/12 delivery; request for a
              duplicate of INV 2026/4187.
            </p>
          </div>
        </div>
      </section>
    </div>
  `,
})
export class SlTocCustomerDemo {}

/** The same sections with sticky headers, for the page whose bar sits in the header. */
@Component({
  selector: 'sl-toc-customer-sticky-demo',
  standalone: true,
  imports: SECTION_PARTS,
  template: `
    <div slStack [gap]="8">
      <section slSection id="dados-gerais" sticky>
        <div slSectionHeader>
          <div slSectionTitle><h2 slSectionHeading>Dados gerais</h2></div>
        </div>
        <div slSectionBody>
          <div slStack [gap]="6">
            <p slText size="sm">
              Aurora Distribution Inc. · EIN 12-3456789 · customer since March 2019. Segment:
              grocery retail, 14 stores in the Portland area.
            </p>
            <p slText size="sm">
              Account manager: Rita Sanders. Last order on September 12, 2026, 38 lines, delivered
              on time.
            </p>
          </div>
        </div>
      </section>
      <section slSection id="enderecos" sticky>
        <div slSectionHeader>
          <div slSectionTitle><h2 slSectionHeading>Addresses</h2></div>
        </div>
        <div slSectionBody>
          <div slStack [gap]="6">
            <p slText size="sm">
              Two active addresses. Billing and delivery have differed since the warehouse move in
              2024.
            </p>
          </div>
          <section slSection id="faturacao">
            <div slSectionHeader>
              <div slSectionTitle><h3 slSectionHeading>Billing</h3></div>
            </div>
            <div slSectionBody>
              <p slText size="sm">
                412 Main Street, Floor 3 · Portland, OR 97204. Electronic invoice by PDF, sent to
                the accounting firm.
              </p>
            </div>
          </section>
          <section slSection id="delivery">
            <div slSectionHeader>
              <div slSectionTitle><h3 slSectionHeading>Delivery</h3></div>
            </div>
            <div slSectionBody>
              <p slText size="sm">
                Central warehouse, Harbor Industrial Park, lot 27 · Portland, OR 97210. Receiving
                Monday to Friday, 7 AM to 3 PM; dock 3 for pallets.
              </p>
            </div>
          </section>
        </div>
      </section>
      <section slSection id="contactos" sticky>
        <div slSectionHeader>
          <div slSectionTitle><h2 slSectionHeading>Contactos</h2></div>
        </div>
        <div slSectionBody>
          <div slStack [gap]="6">
            <p slText size="sm">
              Purchasing: Joan Ferris, +1 503 555 0142. Finance: Noah Baptist,
              invoices&#64;aurora-dist.com. Warehouse receiving: Charles Pine, ext. 214.
            </p>
          </div>
        </div>
      </section>
      <section slSection id="condicoes" sticky>
        <div slSectionHeader>
          <div slSectionTitle><h2 slSectionHeading>Commercial terms</h2></div>
        </div>
        <div slSectionBody>
          <div slStack [gap]="6">
            <p slText size="sm">Terms negotiated in January 2026, valid until annual review.</p>
          </div>
          <section slSection id="payment-terms">
            <div slSectionHeader>
              <div slSectionTitle><h3 slSectionHeading>Payment terms</h3></div>
            </div>
            <div slSectionBody>
              <p slText size="sm">
                Payment 45 days after the invoice date, by ACH transfer. 1.5% discount for payment
                within 10 days.
              </p>
            </div>
          </section>
          <section slSection id="limite">
            <div slSectionHeader>
              <div slSectionTitle><h3 slSectionHeading>Credit limit</h3></div>
            </div>
            <div slSectionBody>
              <p slText size="sm">
                Credit limit of $180,000.00. Current exposure of $112,430.80. Three invoices not yet
                due, none overdue.
              </p>
            </div>
          </section>
        </div>
      </section>
      <section slSection id="invoices" sticky>
        <div slSectionHeader>
          <div slSectionTitle><h2 slSectionHeading>Invoices</h2></div>
        </div>
        <div slSectionBody>
          <div slStack [gap]="6">
            <p slText size="sm">
              FT 2026/4471 · 12/09/2026 · 38 412,60 € · por vencer. FT 2026/4302 · 28/08/2026 · 41
              905,00 € · por vencer. FT 2026/4187 · 14/08/2026 · 32 113,20 € · por vencer.
            </p>
            <p slText size="sm">FT 2026/4020 · 31/07/2026 · 29 870,00 € · paga em 09/09/2026.</p>
          </div>
        </div>
      </section>
      <section slSection id="suporte" sticky>
        <div slSectionHeader>
          <div slSectionTitle><h2 slSectionHeading>Suporte</h2></div>
        </div>
        <div slSectionBody>
          <div slStack [gap]="6">
            <p slText size="sm">
              Two open requests: replacement of 6 boxes damaged in the 09/12 delivery; request for a
              duplicate of INV 2026/4187.
            </p>
          </div>
        </div>
      </section>
    </div>
  `,
})
export class SlTocCustomerStickyDemo {}

/** The returns policy, as prose whose headings the list is read from. */
@Component({
  selector: 'sl-toc-policy-demo',
  standalone: true,
  imports: [SlProse],
  template: `
    <div slProse>
      <h1>Returns and refunds policy</h1>
      <p>
        This policy applies to all merchandise sold by Nexora to business customers and replaces the
        2024 version. Deadlines run from the receipt date recorded on the proof of delivery.
      </p>
      <h2>Scope</h2>
      <p>
        Covers catalog products, made-to-order items and invoiced samples. Does not cover
        installation services, which have their own terms in the service agreement.
      </p>
      <h2>Return periods</h2>
      <p>
        The general period is 30 days after receipt. Products with an expiry date, a cold chain or
        sealed packaging have shorter periods, described below.
      </p>
      <h3>Perishables</h3>
      <p>
        Refrigerated or frozen goods are accepted only if the claim is opened on the day of delivery
        and the temperature recorded at the dock is outside the contracted range.
      </p>
      <h3>Sealed packaging</h3>
      <p>
        An opened package loses the right to return for change of mind, but not for a defect. The
        defect assessment is done in the warehouse within five business days.
      </p>
      <h2>Condition of the goods</h2>
      <p>
        Returned goods must arrive with the original label and a legible lot number. Boxes
        repackaged by the customer are accepted when the lot is traceable.
      </p>
      <h2>Refunds</h2>
      <p>
        The refund is issued as a credit note against the original invoice and applied to the next
        invoice, or paid by ACH transfer at the customer’s request within 15 days.
      </p>
      <h3>Pickup costs</h3>
      <p>
        Pickup is free when the return results from a shipping error or a defect. For returns for
        change of mind the pickup cost is deducted from the refund.
      </p>
      <h2>Exceptions</h2>
      <p>
        Discontinued products, products customized with the customer’s brand or bought in a sale
        campaign are not returnable for change of mind.
      </p>
    </div>
  `,
})
export class SlTocPolicyDemo {}

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
    'This contract governs the continued supply of corrugated cardboard packaging by Riverside Cartons Inc. to Nexora, in the quantities and specifications of annex I.',
  fornecimento:
    'The supplier undertakes to keep in stock, at all times, the equivalent of four weeks of average consumption.',
  orders:
    'Orders are issued by electronic purchase order and are deemed accepted if not refused within 24 hours.',
  deliveries:
    'The delivery period is five business days. A delay of more than three business days gives rise to a penalty of 0.5% per day on the line value.',
  returns:
    'Non-conforming goods are returned at the supplier’s expense, who replaces them within ten business days.',
  precos: 'The prices in annex II are fixed for twelve months from signing.',
  revisao:
    'After the initial period, prices may be reviewed annually by the change in the paper price index published by CEPI.',
  'faturacao-contrato':
    'Billing is monthly, due at 60 days. Invoices without a purchase order number are returned.',
  vigencia:
    'The contract runs for 24 months and renews for equal periods unless terminated with 90 days’ notice.',
  foro: 'For all questions arising from this contract the courts of Multnomah County, Oregon have jurisdiction, waiving any other.',
};

/** The supplier contract, clause by clause, numbered by the list. */
@Component({
  selector: 'sl-toc-contract-demo',
  standalone: true,
  imports: [SlHeading, SlStack, SlText],
  template: `
    <div slStack [gap]="8">
      @for (clause of items; track clause.id; let i = $index) {
        <section [id]="clause.id">
          <div slStack [gap]="5">
            <h2 slHeading size="lg">{{ i + 1 }}. {{ clause.label }}</h2>
            <p slText size="sm">{{ text(clause.id) }}</p>
            @for (sub of clause.children ?? []; track sub.id; let j = $index) {
              <section [id]="sub.id">
                <div slStack [gap]="4">
                  <h3 slHeading size="md">{{ i + 1 }}.{{ j + 1 }}. {{ sub.label }}</h3>
                  <p slText size="sm">{{ text(sub.id) }}</p>
                </div>
              </section>
            }
          </div>
        </section>
      }
    </div>
  `,
})
export class SlTocContractDemo {
  readonly items = CONTRACT_ITEMS;
  text(id: string): string {
    return CONTRACT_TEXT[id] ?? '';
  }
}
