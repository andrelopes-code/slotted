/**
 * Error model (sections 73.10, 73.11 and 81).
 */

export type ApiErrorCode =
  | 'INVALID_QUERY'
  | 'INVALID_SORT'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'STALE_VERSION'
  | 'INVALID_STATE_TRANSITION'
  | 'INVENTORY_CHANGED'
  | 'IDEMPOTENCY_KEY_REUSED'
  | 'VALIDATION_FAILED'
  | 'PRECONDITION_REQUIRED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'INVOICE_ALREADY_PAID'
  | 'ORDER_ALREADY_CANCELLED'
  | 'APPROVAL_ALREADY_DECIDED'
  | 'WORKFLOW_RECURSION_LIMIT'
  | (string & {});

export interface FieldError {
  field: string;
  code: string;
  message: string;
}

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    retryable: boolean;
    correlationId: string;
    fieldErrors?: FieldError[];
    details?: Record<string, unknown>;
  };
}

const STATUS_BY_CODE: Record<string, number> = {
  INVALID_QUERY: 400,
  INVALID_SORT: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  STALE_VERSION: 409,
  INVALID_STATE_TRANSITION: 409,
  INVENTORY_CHANGED: 409,
  IDEMPOTENCY_KEY_REUSED: 409,
  INVOICE_ALREADY_PAID: 409,
  ORDER_ALREADY_CANCELLED: 409,
  APPROVAL_ALREADY_DECIDED: 409,
  WORKFLOW_RECURSION_LIMIT: 409,
  VALIDATION_FAILED: 422,
  PRECONDITION_REQUIRED: 428,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

export class NexoraApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly retryable: boolean;
  readonly correlationId: string;
  readonly fieldErrors: FieldError[] | undefined;
  readonly details: Record<string, unknown> | undefined;

  constructor(
    code: ApiErrorCode,
    message: string,
    options: {
      status?: number;
      retryable?: boolean;
      correlationId?: string;
      fieldErrors?: FieldError[];
      details?: Record<string, unknown>;
    } = {},
  ) {
    super(message);
    this.name = 'NexoraApiError';
    this.code = code;
    this.status = options.status ?? STATUS_BY_CODE[code] ?? 409;
    this.retryable = options.retryable ?? this.status === 503;
    this.correlationId = options.correlationId ?? 'pending';
    this.fieldErrors = options.fieldErrors;
    this.details = options.details;
  }

  withCorrelationId(correlationId: string): NexoraApiError {
    const error = new NexoraApiError(this.code, this.message, {
      status: this.status,
      retryable: this.retryable,
      correlationId,
      ...(this.fieldErrors ? { fieldErrors: this.fieldErrors } : {}),
      ...(this.details ? { details: this.details } : {}),
    });
    return error;
  }

  toBody(): ApiErrorBody {
    return {
      error: {
        code: this.code,
        message: this.message,
        retryable: this.retryable,
        correlationId: this.correlationId,
        ...(this.fieldErrors ? { fieldErrors: this.fieldErrors } : {}),
        ...(this.details ? { details: this.details } : {}),
      },
    };
  }
}

export function notFound(entity: string, id: string): NexoraApiError {
  return new NexoraApiError('NOT_FOUND', `${entity} ${id} was not found`, {
    details: { entity, id },
  });
}

export function forbidden(permission: string, detail?: string): NexoraApiError {
  return new NexoraApiError(
    'FORBIDDEN',
    detail ?? `The signed-in user does not hold ${permission} for this resource`,
    { details: { permission } },
  );
}

export function invalidTransition(entity: string, from: string, action: string): NexoraApiError {
  return new NexoraApiError(
    'INVALID_STATE_TRANSITION',
    `${entity} in status ${from} cannot ${action}`,
    { details: { entity, from, action } },
  );
}

export function validationFailed(
  fieldErrors: FieldError[],
  message = 'Validation failed',
): NexoraApiError {
  return new NexoraApiError('VALIDATION_FAILED', message, { fieldErrors });
}

export function staleVersion(entity: string, expected: number, actual: number): NexoraApiError {
  return new NexoraApiError(
    'STALE_VERSION',
    `${entity} was modified by someone else (expected version ${expected}, current version ${actual})`,
    { details: { expected, actual } },
  );
}

export function preconditionRequired(entity: string): NexoraApiError {
  return new NexoraApiError(
    'PRECONDITION_REQUIRED',
    `Mutating ${entity} requires the last observed version (If-Match)`,
  );
}

/** Section 81 — domain error codes surfaced as 422 VALIDATION_FAILED or 409 transitions. */
export const DOMAIN_ERROR_CODES = {
  crm: [
    'CUSTOMER_ARCHIVED',
    'CUSTOMER_ON_HOLD',
    'CUSTOMER_INACTIVE',
    'CUSTOMER_HAS_OPEN_ACTIVITY',
    'PRIMARY_CONTACT_REQUIRED',
    'DUPLICATE_ACCOUNT_NUMBER',
  ],
  catalog: [
    'SKU_DISCONTINUED',
    'SKU_RESTRICTED',
    'PRICE_NOT_FOUND',
    'QUANTITY_PRECISION_EXCEEDED',
    'CONTRACT_PRICE_OVERLAP',
  ],
  sales: [
    'QUOTE_EMPTY',
    'QUOTE_EXPIRED',
    'QUOTE_ALREADY_CONVERTED',
    'ORDER_ALREADY_CANCELLED',
    'ORDER_HAS_FULFILLED_QUANTITY',
    'ORDER_ON_HOLD',
    'APPROVAL_REQUIRED',
    'SELF_APPROVAL_FORBIDDEN',
    'APPROVAL_ALREADY_DECIDED',
  ],
  inventory: [
    'INSUFFICIENT_AVAILABILITY',
    'INVENTORY_CHANGED',
    'WAREHOUSE_CLOSED',
    'LOCATION_BLOCKED',
    'RESERVATION_CONSUMED',
    'ADJUSTMENT_NOTE_REQUIRED',
    'TRANSFER_SAME_WAREHOUSE',
  ],
  procurement: [
    'SUPPLIER_ON_HOLD',
    'SUPPLIER_INACTIVE',
    'OVER_RECEIPT_TOLERANCE',
    'PO_QUANTITY_BELOW_RECEIVED',
    'RECEIPT_EMPTY',
  ],
  finance: [
    'INVOICE_ALREADY_PAID',
    'INVOICE_HAS_ALLOCATIONS',
    'OVER_INVOICING',
    'ALLOCATION_EXCEEDS_OUTSTANDING',
    'ALLOCATION_EXCEEDS_PAYMENT',
    'CURRENCY_MISMATCH',
    'WRITE_OFF_LIMIT_EXCEEDED',
    'CREDIT_EXCEEDED',
    'PAYMENT_NOT_POSTED',
  ],
  support: [
    'TICKET_CLOSED',
    'RESOLUTION_CODE_REQUIRED',
    'ESCALATION_REASON_REQUIRED',
    'REOPEN_WINDOW_EXPIRED',
  ],
} as const;
