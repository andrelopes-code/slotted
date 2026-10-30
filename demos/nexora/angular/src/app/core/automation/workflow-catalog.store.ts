import { computed, inject, Injectable, signal } from '@angular/core';
import type { WorkflowCatalog, WorkflowTriggerDefinition } from '@slotted/demo-nexora-backend';

import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { TransportHealth } from '../backend/transport-health';
import { SessionStore } from '../session/session.store';

/**
 * What an editor offers and a sentence reads (§69.1–§69.3): each trigger with
 * the fields its subject carries, the actions, the limits and the people an
 * action can name. Read once per persona and scenario; the backend validates
 * from the same catalog, so the screen marks what it would refuse.
 */
@Injectable({ providedIn: 'root' })
export class WorkflowCatalogStore {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly health = inject(TransportHealth);
  private readonly session = inject(SessionStore);

  readonly catalog = signal<WorkflowCatalog | null>(null);
  readonly failed = signal(false);
  private key: string | null = null;
  private pending: Promise<WorkflowCatalog | null> | null = null;

  readonly triggers = computed(() => this.catalog()?.triggers ?? []);

  trigger(type: string | undefined): WorkflowTriggerDefinition | undefined {
    return this.triggers().find((trigger) => trigger.type === type);
  }

  /** The catalog for the signed-in persona; null while it cannot be read. */
  ensure(): Promise<WorkflowCatalog | null> {
    const session = this.session.session();
    const key = session ? `${session.user.id}|${session.demo.scenarioId}` : null;
    if (key !== this.key) {
      this.key = key;
      this.catalog.set(null);
      this.pending = null;
    }
    if (this.catalog() !== null) return Promise.resolve(this.catalog());
    this.pending ??= this.read();
    return this.pending;
  }

  private async read(): Promise<WorkflowCatalog | null> {
    this.failed.set(false);
    const api = await this.backend.ready();
    try {
      const catalog = await this.health.read(() => api.workflows.catalog(), null);
      if (catalog === null) this.failed.set(true);
      this.catalog.set(catalog);
      return catalog;
    } catch {
      this.failed.set(true);
      return null;
    } finally {
      this.pending = null;
    }
  }
}
