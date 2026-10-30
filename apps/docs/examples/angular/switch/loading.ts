import { Component, signal } from '@angular/core';
import { SlSwitch, SlSwitchDescription } from '@slotted/angular/switch';

/** Stands in for the request that stores the setting. */
const saveSetting = (on: boolean) =>
  new Promise<boolean>((resolve) => setTimeout(() => resolve(on), 2500));

@Component({
  selector: 'app-switch-loading',
  imports: [SlSwitch, SlSwitchDescription],
  template: `
    <span
      slSwitch
      [checked]="syncing()"
      labelPlacement="start"
      [loading]="saving()"
      [messages]="{ loading: 'Saving order sync' }"
      (checkedChange)="change($event.value)"
    >
      Order sync
      <p slSwitchDescription>Imports new Shopify orders every five minutes.</p>
    </span>
  `,
})
export class SwitchLoading {
  protected readonly syncing = signal(false);
  protected readonly saving = signal(false);

  protected async change(next: boolean) {
    this.saving.set(true);
    this.syncing.set(await saveSetting(next));
    this.saving.set(false);
  }
}
