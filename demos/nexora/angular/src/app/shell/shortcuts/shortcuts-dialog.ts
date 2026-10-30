import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SlDialog, SlDialogBody, SlDialogClose, SlDialogHeader, SlDialogTitle } from '@slotted/angular/dialog';
import { SlKbd, SlShortcut } from '@slotted/angular/kbd';

import { ShortcutsService } from '../../core/shortcuts/shortcuts.service';

@Component({
  selector: 'app-shortcuts-dialog',
  imports: [SlDialog, SlDialogBody, SlDialogClose, SlDialogHeader, SlDialogTitle, SlKbd, SlShortcut],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    dl {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: var(--slotted-space-2) var(--slotted-space-4);
      margin: 0;
      align-items: center;
    }
    dt {
      justify-self: end;
      display: inline-flex;
      gap: var(--slotted-space-1);
    }
    dd {
      margin: 0;
    }
  `,
  template: `
    <sl-dialog [(open)]="shortcuts.dialogOpen" size="sm">
      <header slDialogHeader>
        <h2 slDialogTitle>Keyboard shortcuts</h2>
        <button slDialogClose></button>
      </header>
      <div slDialogBody>
        <dl>
          @for (b of shortcuts.bindings; track b.keys) {
            <dt>
              @if (b.keys.includes(' ')) {
                @for (k of b.keys.split(' '); track $index) {
                  <kbd slKbd size="sm">{{ k }}</kbd>
                }
              } @else {
                <kbd slShortcut [keys]="b.keys" size="sm"></kbd>
              }
            </dt>
            <dd>{{ b.label }}</dd>
          }
        </dl>
      </div>
    </sl-dialog>
  `,
})
export class ShortcutsDialog {
  readonly shortcuts = inject(ShortcutsService);
}
