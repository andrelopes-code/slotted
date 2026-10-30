import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { SlStatusIndicator } from '@slotted/angular/status-indicator';

import { TransportHealth } from '../../core/backend/transport-health';

@Component({
  selector: 'app-connection-status',
  imports: [SlStatusIndicator],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span slStatusIndicator [status]="status()" size="sm" live="polite">{{ label() }}</span>`,
})
export class ConnectionStatus {
  private readonly health = inject(TransportHealth);
  readonly status = computed(() => (this.health.degraded() ? 'warning' : 'success'));
  readonly label = computed(() => (this.health.degraded() ? 'Degraded' : 'All systems normal'));
}
