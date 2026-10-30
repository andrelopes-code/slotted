import type { EntityMetadata } from './common';

export type TicketStatus =
  'new' | 'open' | 'pending_customer' | 'pending_internal' | 'escalated' | 'resolved' | 'closed';

export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TicketChannel = 'email' | 'phone' | 'portal' | 'chat' | 'internal';

export type SlaState = 'met' | 'at_risk' | 'breached' | 'paused' | 'running' | 'not_applicable';

export interface SupportTicket {
  id: string;
  organizationId: string;
  ticketNumber: string;
  customerId: string;
  contactId?: string;
  subject: string;
  description: string;
  channel: TicketChannel;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTeamId: string;
  assigneeId?: string;
  relatedOrderId?: string;
  relatedInvoiceId?: string;
  relatedSkuId?: string;
  relatedShipmentId?: string;
  firstResponseDueAt: string;
  resolutionDueAt: string;
  firstRespondedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  resolutionCode?: string;
  escalationReason?: string;
  /** projection */
  firstResponseSla: SlaState;
  /** projection */
  resolutionSla: SlaState;
  /** projection */
  messageCount: number;
  lastCustomerMessageAt?: string;
  lastAgentMessageAt?: string;
  satisfactionScore?: number;
  tags: string[];
  metadata: EntityMetadata;
}

export interface ConversationMessage {
  id: string;
  organizationId: string;
  ticketId: string;
  authorType: 'user' | 'customer' | 'system';
  authorUserId?: string;
  authorContactId?: string;
  visibility: 'public' | 'internal';
  body: string;
  attachmentIds: string[];
  createdAt: string;
}

export type SlaEventType =
  | 'first_response_started'
  | 'first_response_met'
  | 'first_response_breached'
  | 'resolution_started'
  | 'resolution_paused'
  | 'resolution_resumed'
  | 'resolution_met'
  | 'resolution_breached';

export interface SlaEvent {
  id: string;
  organizationId: string;
  ticketId: string;
  type: SlaEventType;
  occurredAt: string;
}

export interface SupportMacro {
  id: string;
  organizationId: string;
  name: string;
  body: string;
  setStatus?: 'open' | 'pending_customer' | 'pending_internal' | 'resolved';
  addTags: string[];
  status: 'active' | 'inactive';
  metadata: EntityMetadata;
}

/** Section 68.3 targets in business minutes. */
export const SLA_TARGETS: Record<
  TicketPriority,
  { firstResponseMinutes: number; resolutionMinutes: number }
> = {
  low: { firstResponseMinutes: 8 * 60, resolutionMinutes: 5 * 10 * 60 },
  normal: { firstResponseMinutes: 4 * 60, resolutionMinutes: 2 * 10 * 60 },
  high: { firstResponseMinutes: 60, resolutionMinutes: 8 * 60 },
  urgent: { firstResponseMinutes: 15, resolutionMinutes: 4 * 60 },
};
