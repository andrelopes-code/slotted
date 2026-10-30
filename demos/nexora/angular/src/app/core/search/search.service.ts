import { inject, Injectable, signal } from '@angular/core';
import type { SearchHit, SearchResponse } from '@slotted/demo-nexora-backend';

import { NEXORA_BACKEND } from '../backend/nexora-backend.provider';
import { SessionStore } from '../session/session.store';

const RECENT_LIMIT = 8;
const DEBOUNCE_MS = 150;

const ROUTE_BY_TYPE: Record<SearchHit['type'], string> = {
  customer: '/crm/customers',
  contact: '/crm/contacts',
  sku: '/catalog/products',
  product: '/catalog/products',
  order: '/sales/orders',
  quote: '/sales/quotes',
  invoice: '/finance/invoices',
  supplier: '/procurement/suppliers',
  purchase_order: '/procurement/purchase-orders',
  ticket: '/support/inbox',
};

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly backend = inject(NEXORA_BACKEND);
  private readonly sessionStore = inject(SessionStore);
  private sequence = 0;
  readonly recent = signal<SearchHit[]>(this.readRecent());

  /** `null` when a newer query superseded this one; the caller keeps what it has. */
  async search(q: string): Promise<SearchResponse['groups'] | null> {
    const mine = ++this.sequence;
    if (q.trim().length < 2) return [];
    await new Promise((r) => setTimeout(r, DEBOUNCE_MS));
    if (mine !== this.sequence) return null;
    const api = await this.backend.ready();
    const response = await api.search(q);
    return mine === this.sequence ? response.groups : null;
  }

  routeFor(hit: SearchHit): string {
    return `${ROUTE_BY_TYPE[hit.type]}/${hit.id}`;
  }

  remember(hit: SearchHit): void {
    const next = [hit, ...this.recent().filter((d) => d.id !== hit.id)].slice(0, RECENT_LIMIT);
    this.recent.set(next);
    try {
      localStorage.setItem(this.key(), JSON.stringify(next));
    } catch {
      /* storage unavailable */
    }
  }

  private key(): string {
    return `nexora:recent:${this.sessionStore.user()?.id ?? 'anonymous'}`;
  }

  private readRecent(): SearchHit[] {
    try {
      return JSON.parse(localStorage.getItem(this.key()) ?? '[]') as SearchHit[];
    } catch {
      return [];
    }
  }
}
