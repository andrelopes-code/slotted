import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SlToastRegion } from '@slotted/angular/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SlToastRegion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<router-outlet /><sl-toast-region />',
})
export class App {}
