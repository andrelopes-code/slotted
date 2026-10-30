import { Component } from '@angular/core';
import { SlButton } from '@slotted/angular/button';

@Component({
  selector: 'app-button-basic',
  imports: [SlButton],
  template: `<button slButton type="button" (click)="save()">Save changes</button>`,
})
export class ButtonBasic {
  save(): void {
    console.log('saved');
  }
}
