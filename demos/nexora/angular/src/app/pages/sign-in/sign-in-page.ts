import { ChangeDetectionStrategy, Component, inject, type OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SlAvatar } from '@slotted/angular/avatar';
import { SlCard, SlCardBody } from '@slotted/angular/card';

import { DemoStore } from '../../core/demo/demo.store';
import { roleLabel } from '../../core/nav/permission-area';
import { PreferencesStore } from '../../core/session/preferences.store';
import { SessionStore } from '../../core/session/session.store';
import { BrandMark } from '../../shell/banner/brand-mark';

/** The demonstration's sign-in: an account chooser over the seeded personas, no password. */
@Component({
  selector: 'app-sign-in-page',
  imports: [SlAvatar, SlCard, SlCardBody, BrandMark],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: grid;
      place-items: center;
      min-height: 100dvh;
      padding: var(--slotted-space-8);
    }
    .panel {
      display: grid;
      gap: var(--slotted-space-6);
      inline-size: min(100%, 36rem);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: var(--slotted-space-3);
      font-weight: 600;
      font-size: var(--slotted-font-size-lg);
    }
    h1 {
      margin: 0;
    }
    .accounts {
      display: grid;
      gap: var(--slotted-space-2);
    }
    .account {
      display: flex;
      align-items: center;
      gap: var(--slotted-space-3);
      inline-size: 100%;
      text-align: start;
      background: none;
      border: 0;
      padding: 0;
      font: inherit;
      color: inherit;
      cursor: pointer;
    }
    .account:disabled {
      cursor: default;
      opacity: 0.6;
    }
    .account small {
      color: var(--slotted-text-muted);
      display: block;
    }
  `,
  template: `
    <div class="panel">
      <div class="brand"><app-brand-mark size="32" /> Nexora</div>
      <h1>Sign in to Asteron Industrial Supply</h1>
      <p>Accounts on this device</p>
      <div class="accounts">
        @for (p of demo.info()?.personas ?? []; track p.key) {
          <div slCard size="sm">
            <button
              type="button"
              class="account"
              slCardBody
              [disabled]="demo.busy()"
              (click)="signIn(p.key)"
            >
              <span slAvatar [name]="p.name" size="sm" tone="accent" variant="soft"></span>
              <span>
                {{ p.name }}
                <small>{{ roleLabel(p.role) }} · {{ p.context }}</small>
              </span>
            </button>
          </div>
        }
      </div>
    </div>
  `,
})
export class SignInPage implements OnInit {
  readonly demo = inject(DemoStore);
  readonly roleLabel = roleLabel;
  private readonly session = inject(SessionStore);
  private readonly preferences = inject(PreferencesStore);
  private readonly router = inject(Router);

  ngOnInit(): void {
    void this.demo.load();
  }

  async signIn(key: string): Promise<void> {
    await this.demo.setPersona(key);
    if (this.session.status() === 'ready') {
      await this.router.navigateByUrl(this.preferences.preferences().startRoute);
    }
  }
}
