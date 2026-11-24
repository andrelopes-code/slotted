import { Component } from '@angular/core';
import { SlAvatar } from '@slotted/angular/avatar';
import { SlInline } from '@slotted/angular/inline';

@Component({
  selector: 'app-avatar-interactive',
  imports: [SlAvatar, SlInline],
  template: `
    <div slInline align="center" [gap]="4">
      <a slAvatar name="Maria Chen" size="lg" href="#maria-chen"></a>
      <button slAvatar name="Tomas Reyes" size="lg" type="button"></button>
      <a slAvatar name="Priya Raman" size="xs" href="#priya-raman"></a>
      <button slAvatar disabled name="Samuel Okafor" size="lg" type="button"></button>
    </div>
  `,
})
export class AvatarInteractive {}
