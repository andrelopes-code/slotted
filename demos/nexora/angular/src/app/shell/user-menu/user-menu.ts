import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SlAvatar } from '@slotted/angular/avatar';
import {
  SlMenu,
  SlMenuGroup,
  SlMenuItem,
  SlMenuRadioGroup,
  SlMenuSeparator,
  SlMenuTrigger,
} from '@slotted/angular/menu';
import { SlTopNavigationAccount } from '@slotted/angular/top-navigation';

import { DemoStore } from '../../core/demo/demo.store';
import { type NexoraLocale, PreferencesStore } from '../../core/session/preferences.store';
import { SessionStore } from '../../core/session/session.store';
import { ShortcutsService } from '../../core/shortcuts/shortcuts.service';

@Component({
  selector: 'app-user-menu',
  imports: [
    SlAvatar,
    SlMenu,
    SlMenuGroup,
    SlMenuItem,
    SlMenuRadioGroup,
    SlMenuSeparator,
    SlMenuTrigger,
    SlTopNavigationAccount,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    /* The menu's surface is a three-column grid; a block of its own spans all three. */
    .identity {
      display: grid;
      grid-column: 1 / -1;
      grid-template-columns: auto 1fr;
      gap: var(--slotted-space-3);
      padding: var(--slotted-space-3);
      align-items: center;
    }
    .identity small {
      display: block;
      color: var(--slotted-text-muted);
    }
  `,
  template: `
    <button slTopNavigationAccount [slMenuTriggerFor]="menu" aria-label="Account">
      <span slAvatar size="xs" tone="accent" variant="soft" [name]="user()?.displayName"></span>
    </button>
    <sl-menu #menu align="end" size="md">
      <div class="identity" role="presentation">
        <span slAvatar size="md" tone="accent" variant="soft" [name]="user()?.displayName"></span>
        <span>
          <strong>{{ user()?.displayName }}</strong>
          <small>{{ user()?.email }}</small>
          <small>{{ roleLine() }}</small>
        </span>
      </div>
      <hr slMenuSeparator />
      <button slMenuItem (select)="go('/profile')">Your profile</button>
      <button slMenuItem (select)="go('/settings/preferences')">Preferences</button>
      <hr slMenuSeparator />
      <sl-menu-group label="Appearance">
        <sl-menu-radio-group
          [value]="preferences.preferences().scheme"
          (valueChangeRequest)="setScheme($event.value)"
        >
          <button slMenuRadioItem value="light" [closeOnSelect]="false">Light</button>
          <button slMenuRadioItem value="dark" [closeOnSelect]="false">Dark</button>
          <button slMenuRadioItem value="system" [closeOnSelect]="false">System</button>
        </sl-menu-radio-group>
      </sl-menu-group>
      <sl-menu-group label="Density">
        <sl-menu-radio-group
          [value]="preferences.preferences().density"
          (valueChangeRequest)="setDensity($event.value)"
        >
          <button slMenuRadioItem value="comfortable" [closeOnSelect]="false">Comfortable</button>
          <button slMenuRadioItem value="compact" [closeOnSelect]="false">Compact</button>
          <button slMenuRadioItem value="dense" [closeOnSelect]="false">Dense</button>
        </sl-menu-radio-group>
      </sl-menu-group>
      <sl-menu-group label="Language">
        <sl-menu-radio-group
          [value]="preferences.preferences().locale"
          (valueChangeRequest)="setLocale($event.value)"
        >
          <button slMenuRadioItem value="en-US" lang="en-US" [closeOnSelect]="false">English</button>
          <button slMenuRadioItem value="pt-BR" lang="pt-BR" [closeOnSelect]="false">
            Português (Brasil)
          </button>
        </sl-menu-radio-group>
      </sl-menu-group>
      <hr slMenuSeparator />
      <button slMenuItem shortcut="?" (select)="shortcuts.openDialog()">Keyboard shortcuts</button>
      <hr slMenuSeparator />
      <button slMenuItem tone="danger" (select)="signOut()">Sign out</button>
    </sl-menu>
  `,
})
export class UserMenu {
  readonly session = inject(SessionStore);
  readonly preferences = inject(PreferencesStore);
  readonly shortcuts = inject(ShortcutsService);
  private readonly demo = inject(DemoStore);
  private readonly router = inject(Router);

  readonly user = this.session.user;
  readonly roleLine = computed(() => {
    const s = this.session.session();
    if (s === null) return '';
    return [s.roles[0]?.name, s.teams[0]?.name].filter(Boolean).join(' · ');
  });

  go(url: string): void {
    void this.router.navigateByUrl(url);
  }

  setScheme(value: string): void {
    this.preferences.update({ scheme: value as 'light' | 'dark' | 'system' });
  }

  setLocale(value: string): void {
    this.preferences.update({ locale: value as NexoraLocale });
  }

  setDensity(value: string): void {
    this.preferences.update({ density: value as 'comfortable' | 'compact' | 'dense' });
  }

  /** Only the client forgets the persona; the sign-in page chooses the next one. */
  async signOut(): Promise<void> {
    await this.demo.signOut();
    await this.router.navigateByUrl('/sign-in');
  }
}
