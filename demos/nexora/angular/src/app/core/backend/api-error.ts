import { NexoraApiError } from '@slotted/demo-nexora-backend';

export function isApiError(error: unknown, code?: string): error is NexoraApiError {
  return error instanceof NexoraApiError && (code === undefined || error.code === code);
}
