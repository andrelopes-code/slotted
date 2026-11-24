import { Component } from '@angular/core';
import { provideAvatarDefaults, SlAvatar } from '@slotted/angular/avatar';
import { SlInline } from '@slotted/angular/inline';

@Component({
  selector: 'app-avatar-defaults',
  imports: [SlAvatar, SlInline],
  providers: [provideAvatarDefaults({ shape: 'square', size: 'lg', variant: 'solid' })],
  template: `
    <div slInline align="center" [gap]="4">
      <span slAvatar name="Night shift"></span>
      <span slAvatar name="Receiving"></span>
      <span slAvatar name="Maria Chen" shape="circle" size="sm"></span>
    </div>
  `,
})
export class AvatarDefaults {}
