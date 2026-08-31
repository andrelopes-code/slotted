import { Injectable } from '@angular/core';

/**
 * Application-scoped rather than module-scoped: a module-level counter
 * produces colliding sequences when two applications render in one server
 * process, and the server and client sequences must match for hydration.
 */
@Injectable({ providedIn: 'root' })
export class SlFieldIdFactory {
  private count = 0;

  next() {
    this.count += 1;
    return `slotted-field-${this.count}`;
  }
}
