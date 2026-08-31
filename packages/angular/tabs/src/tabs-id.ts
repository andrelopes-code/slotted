import { Injectable } from '@angular/core';

/** Application-scoped for the reason recorded on SlFieldIdFactory. */
@Injectable({ providedIn: 'root' })
export class SlTabsIdFactory {
  private count = 0;

  next() {
    this.count += 1;
    return `slotted-tabs-${this.count}`;
  }
}
