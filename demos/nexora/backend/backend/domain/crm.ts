import type {
  CurrencyCode,
  CustomerSegment,
  EntityMetadata,
  Money,
  PaymentTermsCode,
  RegionCode,
  TaxProfile,
} from './common';

export type CustomerStatus = 'prospect' | 'active' | 'on_hold' | 'inactive' | 'closed';
export type CustomerHealth = 'healthy' | 'watch' | 'at_risk';

export interface Customer {
  id: string;
  organizationId: string;
  accountNumber: string;
  regionCode: RegionCode;
  legalName: string;
  displayName: string;
  status: CustomerStatus;
  segment: CustomerSegment;
  industry: string;
  employeeBand?: string;
  website?: string;
  primaryContactId?: string;
  accountOwnerId: string;
  salesTeamId: string;
  billingAddressId?: string;
  defaultShippingAddressId?: string;
  paymentTermsCode: PaymentTermsCode;
  creditLimit: Money;
  priceListId: string;
  taxProfile: TaxProfile;
  preferredCurrency: CurrencyCode;
  customerSince?: string;
  annualRevenueEstimate?: Money;
  health: CustomerHealth;
  holdReason?: string;
  tags: string[];
  metadata: EntityMetadata;
}

/** Section 56.3 — projections, never editable. */
export interface CustomerFinancialSummary {
  customerId: string;
  grossReceivables: Money;
  unappliedCredit: Money;
  netReceivables: Money;
  openOrderExposure: Money;
  creditExposure: Money;
  creditUtilizationBps: number;
  overdueReceivables: Money;
  lifetimeRevenue: Money;
  ordersLast12Months: number;
  averageOrderValueLast12Months: Money;
  openInvoiceCount: number;
  overdueInvoiceCount: number;
  openOrderCount: number;
  openTicketCount: number;
  projectedAt: string;
}

export interface Contact {
  id: string;
  organizationId: string;
  customerId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  title?: string;
  department?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  preferredContactMethod?: 'email' | 'phone' | 'mobile';
  isPrimary: boolean;
  status: 'active' | 'inactive';
  lastContactedAt?: string;
  metadata: EntityMetadata;
}

export type AddressOwnerType = 'customer' | 'supplier';
export type AddressType = 'billing' | 'shipping' | 'headquarters' | 'service_location';

export interface Address {
  id: string;
  organizationId: string;
  ownerType: AddressOwnerType;
  ownerId: string;
  type: AddressType;
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  countryCode: string;
  deliveryInstructions?: string;
  isDefault: boolean;
  metadata: EntityMetadata;
}

export type NoteVisibility = 'organization' | 'team' | 'private';

export interface CustomerNote {
  id: string;
  organizationId: string;
  customerId: string;
  authorId: string;
  body: string;
  visibility: NoteVisibility;
  teamId?: string;
  isPinned: boolean;
  mentionedUserIds: string[];
  attachmentIds: string[];
  metadata: EntityMetadata;
}
