import { DOCUMENT, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

import { visibleModules } from '../nav/nav.model';
import { SessionStore } from '../session/session.store';

export interface Binding {
  keys: string;
  label: string;
}

const SEQUENCE_WINDOW_MS = 800;

@Injectable({ providedIn: 'root' })
export class ShortcutsService {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly session = inject(SessionStore);
  private installed = false;
  private pendingG = 0;
  readonly dialogOpen = signal(false);
  readonly demoRequested = signal(0);

  readonly bindings: readonly Binding[] = [
    { keys: 'mod+k', label: 'Search or jump to' },
    { keys: 'mod+shift+d', label: 'Demo controls' },
    { keys: '?', label: 'Keyboard shortcuts' },
    { keys: 'g h', label: 'Go to Home' },
    { keys: 'g c', label: 'Go to CRM' },
    { keys: 'g s', label: 'Go to Sales' },
    { keys: 'g i', label: 'Go to Inventory' },
    { keys: 'g f', label: 'Go to Finance' },
    { keys: 'j', label: 'Next ticket, in the support inbox' },
    { keys: 'k', label: 'Previous ticket, in the support inbox' },
    { keys: 'esc', label: 'Close what is open' },
  ];

  openDialog(): void {
    this.dialogOpen.set(true);
  }

  install(): void {
    if (this.installed) return;
    this.installed = true;
    this.document.addEventListener('keydown', (event) => this.handle(event));
  }

  private handle(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const typing =
      target !== null &&
      target !== this.document.body &&
      (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName ?? ''));
    const mod = event.metaKey || event.ctrlKey;
    if (mod && event.shiftKey && event.key.toLowerCase() === 'd') {
      event.preventDefault();
      this.demoRequested.update((n) => n + 1);
      return;
    }
    if (typing || mod || event.altKey) return;
    if (event.key === '?') {
      event.preventDefault();
      this.dialogOpen.set(true);
      return;
    }
    const now = performance.now();
    if (event.key === 'g') {
      this.pendingG = now;
      return;
    }
    if (this.pendingG !== 0 && now - this.pendingG < SEQUENCE_WINDOW_MS) {
      this.pendingG = 0;
      const module = visibleModules((p) => this.session.can(p)).find((m) => m.key === event.key);
      if (module !== undefined) {
        event.preventDefault();
        void this.router.navigateByUrl(module.destinations[0]?.path ?? module.path);
      }
    }
  }
}
