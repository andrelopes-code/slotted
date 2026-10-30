import { Component, computed, signal } from '@angular/core';
import { SlButton, SlButtonEnd } from '@slotted/angular/button';
import { SlGlyph } from '@slotted/angular/icon';
import { SlInline } from '@slotted/angular/inline';
import { SlMenu, SlMenuItem, SlMenuTrigger } from '@slotted/angular/menu';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-menu-checkbox-items',
  imports: [SlButton, SlButtonEnd, SlGlyph, SlInline, SlMenu, SlMenuItem, SlMenuTrigger, SlText],
  template: `
    <div slInline align="center" [gap]="3">
      <button slButton variant="outline" [slMenuTriggerFor]="show">
        Show
        <span slButtonEnd><svg slGlyph name="chevron-down"></svg></span>
      </button>
      <sl-menu #show>
        <button slMenuCheckboxItem [(checked)]="archived">Archived orders</button>
        <button slMenuCheckboxItem [(checked)]="test">Test orders</button>
        <button slMenuCheckboxItem [(checked)]="cancelled">Cancelled orders</button>
      </sl-menu>
      <span slText size="sm" tone="muted">{{ summary() }}</span>
    </div>
  `,
})
export class MenuCheckboxItems {
  protected readonly archived = signal(false);
  protected readonly test = signal(false);
  protected readonly cancelled = signal(true);
  protected readonly summary = computed(() => {
    const shown = [
      this.archived() && 'archived',
      this.test() && 'test',
      this.cancelled() && 'cancelled',
    ].filter(Boolean);
    return shown.length === 0 ? 'Open orders only' : `Including ${shown.join(', ')}`;
  });
}
