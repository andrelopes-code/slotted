import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  type Type,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';

import { ForbiddenPage } from '../../pages/forbidden/forbidden-page';
import { SessionStore } from '../session/session.store';

/** A page fetched when its route is first opened, so a module's screens leave the initial bundle. */
export interface LazyPage {
  readonly load: () => Promise<Type<unknown>>;
}

/** The import is taken once and kept, so a page preloaded at start opens without a second wait. */
export const lazyPage = (load: () => Promise<Type<unknown>>): LazyPage => {
  let pending: Promise<Type<unknown>> | null = null;
  return { load: () => (pending ??= load()) };
};

export const isLazy = (page: Type<unknown> | LazyPage): page is LazyPage =>
  typeof page === 'object' && 'load' in page;

/**
 * The route keeps its URL when access is denied: the page is replaced in
 * place, so a deep link a colleague pasted still says where it was pointing.
 */
@Component({
  selector: 'app-permission-gate',
  imports: [NgComponentOutlet, ForbiddenPage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (missing(); as permission) {
      <app-forbidden-page [permission]="permission" />
    } @else if (page(); as component) {
      <ng-container *ngComponentOutlet="component" />
    }
  `,
})
export class PermissionGate {
  private readonly route = inject(ActivatedRoute);
  private readonly sessionStore = inject(SessionStore);
  private readonly data = toSignal(this.route.data, { initialValue: this.route.snapshot.data });

  private readonly declared = computed(() => this.data()['page'] as Type<unknown> | LazyPage);
  private readonly loaded = signal<Type<unknown> | null>(null);

  readonly page = computed(() => {
    const declared = this.declared();
    if (!isLazy(declared)) return declared;
    // The route resolves a lazy page's chunk before it activates: the page draws with the route.
    return (this.data()['pageComponent'] as Type<unknown> | undefined) ?? this.loaded();
  });

  readonly missing = computed(() => {
    const permissions = (this.data()['permissions'] ?? []) as string[];
    const requires = (this.data()['requires'] ?? []) as string[];
    void this.sessionStore.session();
    // What every reader of the destination needs is named first: it is what the reader asks for.
    const lacking = requires.find((p) => !this.sessionStore.can(p));
    if (lacking !== undefined) return lacking;
    if (permissions.length === 0 || permissions.some((p) => this.sessionStore.can(p))) return null;
    return permissions[0] ?? null;
  });

  constructor() {
    effect(() => {
      const declared = this.declared();
      if (!isLazy(declared)) return;
      this.loaded.set(null);
      void declared.load().then((component) => {
        if (this.declared() === declared) this.loaded.set(component);
      });
    });
  }
}
