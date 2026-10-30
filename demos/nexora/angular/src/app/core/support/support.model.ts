import type { FilterGroup } from '@slotted/core/filter';
import type {
  SlaEventType,
  SlaState,
  SupportAgent,
  SupportMetrics,
  TicketChannel,
  TicketDetail,
  TicketListItem,
  TicketPriority,
  TicketStatus,
} from '@slotted/demo-nexora-backend';

import { classify, type FailureKind, type InventoryFailure } from '../inventory/inventory-failure';

export type { SupportAgent, SupportMetrics, TicketDetail, TicketListItem };
export type TicketMessage = TicketDetail['messages'][number];

/** The inbox is the module's one destination; a ticket is its `:id` (Appendix A). */
export const INBOX_ROUTE = '/support/inbox';
/** The ticket form, on its own route under the inbox it returns to (FM-01). */
export const NEW_TICKET_ROUTE = '/support/inbox/new';

/** §68.1: every status but resolved and closed is work still to do. */
export const OPEN_STATUSES: readonly TicketStatus[] = [
  'new',
  'open',
  'pending_customer',
  'pending_internal',
  'escalated',
];

export const STATUS_LABEL: Record<TicketStatus, string> = {
  new: 'New',
  open: 'Open',
  pending_customer: 'Pending customer',
  pending_internal: 'Pending internal',
  escalated: 'Escalated',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const STATUS_TONE: Record<
  TicketStatus,
  'accent' | 'secondary' | 'warning' | 'danger' | 'success'
> = {
  new: 'accent',
  open: 'accent',
  pending_customer: 'secondary',
  pending_internal: 'warning',
  escalated: 'danger',
  resolved: 'success',
  closed: 'secondary',
};

export const PRIORITY_LABEL: Record<TicketPriority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
};

export const PRIORITY_TONE: Record<TicketPriority, 'secondary' | 'warning' | 'danger'> = {
  low: 'secondary',
  normal: 'secondary',
  high: 'warning',
  urgent: 'danger',
};

export const CHANNEL_LABEL: Record<TicketChannel, string> = {
  email: 'Email',
  phone: 'Phone',
  portal: 'Portal',
  chat: 'Chat',
  internal: 'Internal',
};

export const CATEGORY_LABEL: Record<string, string> = {
  shipping: 'Shipping',
  billing: 'Billing',
  product: 'Product',
  returns: 'Returns',
  account: 'Account',
  portal: 'Portal',
  pricing: 'Pricing',
  other: 'Other',
};

/** The backend's resolution codes (`RESOLUTION_CODES`), in words. */
export const RESOLUTION_LABEL: Record<string, string> = {
  resolved_shipped: 'Shipped',
  resolved_credit_issued: 'Credit issued',
  resolved_replacement: 'Replacement sent',
  resolved_information: 'Information given',
  resolved_no_action: 'No action needed',
  duplicate: 'Duplicate',
  cannot_reproduce: 'Cannot reproduce',
};

export const SLA_LABEL: Record<SlaState, string> = {
  running: 'On track',
  at_risk: 'At risk',
  breached: 'Breached',
  paused: 'Paused',
  met: 'Met',
  not_applicable: 'Not applicable',
};

export const SLA_TONE: Record<SlaState, 'secondary' | 'warning' | 'danger' | 'success'> = {
  running: 'secondary',
  at_risk: 'warning',
  breached: 'danger',
  paused: 'secondary',
  met: 'success',
  not_applicable: 'secondary',
};

export const SLA_EVENT_LABEL: Record<SlaEventType, string> = {
  first_response_started: 'First-response clock started',
  first_response_met: 'First response within target',
  first_response_breached: 'First response after target',
  resolution_started: 'Resolution clock started',
  resolution_paused: 'Resolution clock paused — waiting on the customer',
  resolution_resumed: 'Resolution clock resumed',
  resolution_met: 'Resolved within target',
  resolution_breached: 'Resolution target passed',
};

/** §68.3: Monday to Friday, 08:00 to 18:00 in the organization's zone — ten hours a business day. */
export const BUSINESS_DAY_MINUTES = 600;
export const BUSINESS_HOURS_WORDS = 'Business hours are Monday to Friday, 08:00–18:00 Central time';

/** §68.3's targets, as the policy states them, per priority. */
export const SLA_POLICY_WORDS: Record<TicketPriority, string> = {
  low: 'first response in 8 business hours, resolution in 5 business days',
  normal: 'first response in 4 business hours, resolution in 2 business days',
  high: 'first response in 1 business hour, resolution in 8 business hours',
  urgent: 'first response in 15 business minutes, resolution in 4 business hours',
};

/**
 * A span of business time in its own units: minutes under an hour, hours and
 * minutes under a business day of ten hours, and business days after.
 */
export function businessSpan(minutes: number): string {
  const total = Math.max(0, Math.round(Math.abs(minutes)));
  if (total < 60) return `${total} min`;
  if (total < BUSINESS_DAY_MINUTES) {
    const hours = Math.floor(total / 60);
    const rest = total % 60;
    return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
  }
  const days = Math.floor(total / BUSINESS_DAY_MINUTES);
  const hours = Math.floor((total % BUSINESS_DAY_MINUTES) / 60);
  const unit = days === 1 ? 'business day' : 'business days';
  return hours === 0 ? `${days} ${unit}` : `${days} ${unit} ${hours} h`;
}

/** One of §68.4's two clocks, read from what the backend projects. */
export interface SlaClock {
  readonly state: SlaState;
  readonly remaining: number;
  readonly dueAt: string;
}

export function firstResponseClock(ticket: TicketListItem): SlaClock {
  return {
    state: ticket.firstResponseSla,
    remaining: ticket.firstResponseMinutesRemaining,
    dueAt: ticket.firstResponseDueAt,
  };
}

export function resolutionClock(ticket: TicketListItem): SlaClock {
  return {
    state: ticket.resolutionSla,
    remaining: ticket.resolutionMinutesRemaining,
    dueAt: ticket.resolutionDueAt,
  };
}

/**
 * What a clock says in one line, in business time and never as raw minutes:
 * the time left and the hour it falls due while it runs, by how much it was
 * passed once breached, and that it is stopped while it waits on the customer.
 * `due` formats the due instant in the organization's zone.
 */
export function clockWords(clock: SlaClock, due: (instant: string) => string): string {
  switch (clock.state) {
    case 'running':
    case 'at_risk':
      return `${businessSpan(clock.remaining)} of business time left · due ${due(clock.dueAt)}`;
    case 'breached':
      return `Passed by ${businessSpan(clock.remaining)} of business time · was due ${due(clock.dueAt)}`;
    case 'paused':
      return 'Stopped while the ticket waits on the customer';
    case 'met':
      return 'Met within the target';
    default:
      return 'No target applies';
  }
}

/** The clock a queue row shows: the first response until it is given, then the resolution. */
export function leadingClock(ticket: TicketListItem): { readonly name: string; readonly clock: SlaClock } {
  if (ticket.status === 'resolved' || ticket.status === 'closed')
    return { name: 'Resolution', clock: resolutionClock(ticket) };
  if (!ticket.firstRespondedAt) return { name: 'First response', clock: firstResponseClock(ticket) };
  return { name: 'Resolution', clock: resolutionClock(ticket) };
}

/**
 * A span for a queue's row, where the subject needs the room: business days
 * as `d`, the rest as `businessSpan` says it. The ticket says the span in words.
 */
export function compactSpan(minutes: number): string {
  const total = Math.max(0, Math.round(Math.abs(minutes)));
  if (total < BUSINESS_DAY_MINUTES) return businessSpan(total);
  const days = Math.floor(total / BUSINESS_DAY_MINUTES);
  const hours = Math.floor((total % BUSINESS_DAY_MINUTES) / 60);
  return hours === 0 ? `${days} d` : `${days} d ${hours} h`;
}

/** The row's short clock: what is left or how late, or the clock's state where no span applies. */
export function shortClock(clock: SlaClock): string {
  switch (clock.state) {
    case 'running':
    case 'at_risk':
      return `${compactSpan(clock.remaining)} left`;
    case 'breached':
      return `${compactSpan(clock.remaining)} late`;
    default:
      return SLA_LABEL[clock.state];
  }
}

/** §68.5's commands, by what the ticket's status allows. */
export type TicketCommand =
  | 'assign'
  | 'reply'
  | 'note'
  | 'pendingCustomer'
  | 'pendingInternal'
  | 'escalate'
  | 'resolve'
  | 'reopen'
  | 'close'
  | 'priority';

/** The permission each command checks first (`commands/support.ts`). */
export const COMMAND_PERMISSION: Record<TicketCommand, string> = {
  assign: 'support.assign',
  reply: 'support.reply',
  note: 'support.reply',
  pendingCustomer: 'support.change_status',
  pendingInternal: 'support.change_status',
  escalate: 'support.escalate',
  resolve: 'support.change_status',
  reopen: 'support.change_status',
  close: 'support.change_status',
  priority: 'support.change_status',
};

/** Whether §68.5 lets the ticket's status take the command, whoever asks. */
export function statusAllows(command: TicketCommand, status: TicketStatus): boolean {
  switch (command) {
    case 'assign':
    case 'reply':
    case 'note':
    case 'priority':
      return status !== 'closed';
    case 'pendingCustomer':
    case 'pendingInternal':
      return status === 'open' || status === 'escalated';
    case 'escalate':
      return status === 'new' || status === 'open' || status === 'pending_internal';
    case 'resolve':
      return status !== 'resolved' && status !== 'closed';
    case 'reopen':
      return status === 'resolved' || status === 'closed';
    case 'close':
      return status === 'resolved';
  }
}

/** §68.5 "Reopen": inside seven calendar days of the resolution, and not from closed. */
export function reopenWithinWindow(ticket: TicketListItem, today: string): boolean {
  if (ticket.status !== 'resolved' || !ticket.resolvedAt) return false;
  return daysBetween(today, ticket.resolvedAt.slice(0, 10)) <= 7;
}

/** The permission a reopen needs now: a Support Manager's outside the window or from closed. */
export function reopenPermission(ticket: TicketListItem, today: string): string {
  return reopenWithinWindow(ticket, today) ? 'support.change_status' : 'support.manage';
}

export function daysBetween(later: string, earlier: string): number {
  const at = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
  return Math.round((at(later) - at(earlier)) / 86_400_000);
}

/** What a refusal of a support command means, in the module's words (ER-01). */
export const SUPPORT_WORDS: Record<string, string> = {
  STALE_VERSION: 'Someone else changed this ticket while the page was open.',
  INVALID_STATE_TRANSITION: 'The ticket is no longer in a status that allows this.',
  TICKET_CLOSED: 'This ticket is closed: nothing more can be written on it.',
  REOPEN_WINDOW_EXPIRED: 'The seven-day reopen window has passed; a Support Manager can reopen it.',
  RESOLUTION_CODE_REQUIRED: 'A resolution code is required to resolve the ticket.',
  VALIDATION_FAILED: 'Something the command needs is missing.',
  FORBIDDEN: 'Your role does not hold this command.',
};

export function classifySupport(error: unknown, fallback: string): InventoryFailure {
  const failure = classify(error, SUPPORT_WORDS, fallback);
  // A closed ticket and an expired window are the record's state, never a field to correct.
  return failure.code === 'TICKET_CLOSED' || failure.code === 'REOPEN_WINDOW_EXPIRED'
    ? { ...failure, kind: 'state' }
    : failure;
}

/** What the reader does next about the class of refusal they met (ER-04). */
export function supportAdvice(kind: FailureKind): string {
  switch (kind) {
    case 'conflict':
      return 'The ticket has been read again: what you see is what Nexora holds now. What you wrote is kept.';
    case 'transport':
      return 'Nothing was changed. What you wrote is kept: try again in a moment.';
    case 'permission':
      return 'Your role does not hold this command; the line under the ticket says who does.';
    case 'validation':
      return 'Complete what is missing and try again.';
    default:
      return 'Nothing was changed.';
  }
}

/** Who holds a support command or read, in the words PM-02 and RP-09 name them. */
export const SUPPORT_HOLDERS: Record<string, string> = {
  'support.view':
    'support, sales, finance, an executive, an auditor or an administrator — every role but the buyer and the warehouse roles',
  'support.create': 'a sales manager, a support manager or agent, or an administrator',
  'support.reply': 'a support manager or agent, or an administrator',
  'support.assign': 'a support manager or agent, or an administrator',
  'support.change_status': 'a support manager or agent, or an administrator',
  'support.escalate': 'a support manager or agent, or an administrator',
  'support.manage': 'a support manager or an administrator',
};

/** One queue of the inbox: a name and the bar's own tree, so the pills are the queue (OV-01). */
export interface TicketQueue {
  readonly key: string;
  readonly label: string;
  readonly value: FilterGroup;
}

const setRule = (field: string, values: readonly string[]) => ({
  field,
  filter: {
    kind: 'set' as const,
    join: 'and' as const,
    conditions: [{ operator: 'anyOf' as const, value: [...values] }],
  },
});

const isRule = (field: string, value: boolean) => ({
  field,
  filter: {
    kind: 'boolean' as const,
    join: 'and' as const,
    conditions: [{ operator: 'is' as const, value }],
  },
});

/**
 * The queues an agent works from (§14 "inbox patterns", §34.6). Each is a
 * tree of the bar's own fields: choosing one writes its pills, and editing a
 * pill afterwards leaves a queue the bar marks as changed.
 */
export function ticketQueues(userId: string | null): readonly TicketQueue[] {
  const open = setRule('status', OPEN_STATUSES);
  const queues: TicketQueue[] = [
    { key: 'open', label: 'Open tickets', value: { join: 'and', rules: [open] } },
  ];
  if (userId !== null)
    queues.push({
      key: 'mine',
      label: 'Assigned to me',
      value: { join: 'and', rules: [open, setRule('assigneeId', [userId])] },
    });
  queues.push(
    {
      key: 'new',
      label: 'New',
      value: { join: 'and', rules: [setRule('status', ['new'])] },
    },
    {
      key: 'unassigned',
      label: 'Unassigned',
      value: { join: 'and', rules: [open, isRule('assigned', false)] },
    },
    {
      key: 'at-risk',
      label: 'Resolution at risk',
      value: { join: 'and', rules: [open, setRule('resolutionSla', ['at_risk'])] },
    },
    {
      key: 'breached',
      label: 'Resolution breached',
      value: { join: 'and', rules: [open, setRule('resolutionSla', ['breached'])] },
    },
    {
      key: 'escalated',
      label: 'Escalated',
      value: { join: 'and', rules: [setRule('status', ['escalated'])] },
    },
    {
      key: 'pending-customer',
      label: 'Waiting on the customer',
      value: { join: 'and', rules: [setRule('status', ['pending_customer'])] },
    },
    {
      key: 'resolved',
      label: 'Resolved',
      value: { join: 'and', rules: [setRule('status', ['resolved'])] },
    },
  );
  return queues;
}

/** The queue a link opens: `?queue=<key>` (OV-01's doors from the inbox's figures). */
export function queueFor(key: string | null, userId: string | null): TicketQueue | null {
  if (key === null) return null;
  return ticketQueues(userId).find((queue) => queue.key === key) ?? null;
}

/** The figures of `GET /support/metrics` that are a queue, each with the queue it opens. */
export function metricDoors(metrics: SupportMetrics): readonly {
  readonly key: string;
  readonly label: string;
  readonly value: number;
}[] {
  return [
    { key: 'open', label: 'Open', value: metrics.openTickets },
    { key: 'new', label: 'New', value: metrics.newTickets },
    { key: 'escalated', label: 'Escalated', value: metrics.escalated },
    { key: 'at-risk', label: 'At risk', value: metrics.atRisk },
    { key: 'breached', label: 'Breached', value: metrics.breachedResolution },
  ];
}
