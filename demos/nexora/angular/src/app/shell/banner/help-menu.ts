import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SlMenu, SlMenuItem, SlMenuSeparator, SlMenuTrigger } from '@slotted/angular/menu';
import { SlTopNavigationHelp } from '@slotted/angular/top-navigation';

import { ShortcutsService } from '../../core/shortcuts/shortcuts.service';

@Component({
  selector: 'app-help-menu',
  imports: [SlMenu, SlMenuItem, SlMenuSeparator, SlMenuTrigger, SlTopNavigationHelp],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button slTopNavigationHelp [slMenuTriggerFor]="menu" aria-label="Help"></button>
    <sl-menu #menu align="end">
      <button slMenuItem shortcut="?" (select)="shortcuts.openDialog()">Keyboard shortcuts</button>
      <a slMenuItem href="https://github.com/slotted" target="_blank" rel="noreferrer">Documentation</a>
      <button slMenuItem [disabled]="true">What's new</button>
      <hr slMenuSeparator />
      <a slMenuItem href="mailto:support@nexora.example">Contact support</a>
    </sl-menu>
  `,
})
export class HelpMenu {
  readonly shortcuts = inject(ShortcutsService);
}
