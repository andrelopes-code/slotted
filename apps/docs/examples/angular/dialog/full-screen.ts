import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';
import {
  SlDialog,
  SlDialogBody,
  SlDialogClose,
  SlDialogDescription,
  SlDialogHeader,
  SlDialogTitle,
  SlDialogTrigger,
} from '@slotted/angular/dialog';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

const STOPS = [
  { time: '08:10', place: 'Contoso Foods, 1200 Pike St' },
  { time: '08:55', place: 'Fabrikam Grocers, 410 Broadway E' },
  { time: '09:40', place: 'Tailspin Market, 3300 Fremont Ave N' },
  { time: '10:30', place: 'Woodgrove Deli, 85 Pine St' },
  { time: '11:15', place: 'Wide World Importers, 2201 1st Ave S' },
];

@Component({
  selector: 'app-dialog-full-screen',
  imports: [
    SlButton,
    SlDialog,
    SlDialogBody,
    SlDialogClose,
    SlDialogDescription,
    SlDialogHeader,
    SlDialogTitle,
    SlDialogTrigger,
    SlInline,
    SlStack,
    SlText,
  ],
  template: `
    <button slButton tone="secondary" variant="outline" [slDialogTrigger]="dialog">
      Open route plan
    </button>
    <sl-dialog #dialog="slDialog" fullscreenToggle size="lg">
      <header slDialogHeader>
        <h2 slDialogTitle>Route 14, Tuesday 6 October</h2>
        <p slDialogDescription>5 stops, 38 km, driver Ana Souza.</p>
        <button slDialogClose></button>
      </header>
      <div slDialogBody>
        <div slStack [gap]="3">
          @for (stop of stops; track stop.time) {
            <div slInline [gap]="4">
              <span slText size="sm" tone="muted">{{ stop.time }}</span>
              <span slText size="sm">{{ stop.place }}</span>
            </div>
          }
        </div>
      </div>
    </sl-dialog>
  `,
})
export class DialogFullScreen {
  readonly stops = STOPS;
}
