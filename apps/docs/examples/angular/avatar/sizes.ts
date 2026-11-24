import { Component } from '@angular/core';
import { SlAvatar } from '@slotted/angular/avatar';
import { SlInline } from '@slotted/angular/inline';

@Component({
  selector: 'app-avatar-sizes',
  imports: [SlAvatar, SlInline],
  template: `
    <div slInline align="center" [gap]="4">
      <span slAvatar name="Maria Chen" size="xs"></span>
      <span slAvatar name="Maria Chen" size="sm"></span>
      <span slAvatar name="Maria Chen" size="md"></span>
      <span slAvatar name="Maria Chen" size="lg"></span>
      <span slAvatar name="Maria Chen" size="xl"></span>
    </div>
  `,
})
export class AvatarSizes {}
