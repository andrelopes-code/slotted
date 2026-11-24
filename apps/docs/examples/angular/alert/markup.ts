import { Component } from '@angular/core';
import {
  SlAlert,
  SlAlertContent,
  SlAlertDescription,
  SlAlertIcon,
  SlAlertTitle,
} from '@slotted/angular/alert';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';

@Component({
  selector: 'app-alert-markup',
  imports: [
    SlAlert,
    SlAlertContent,
    SlAlertDescription,
    SlAlertIcon,
    SlAlertTitle,
    SlGlyph,
    SlIcon,
  ],
  template: `
    <section slAlert reach="page" tone="secondary">
      <span slAlertIcon slIcon><svg slGlyph name="calendar"></svg></span>
      <div slAlertContent>
        <h3 slAlertTitle>Rotterdam warehouse is closed</h3>
        <p slAlertDescription>Orders ship from Antwerp until Monday.</p>
      </div>
    </section>
  `,
})
export class AlertMarkup {}
