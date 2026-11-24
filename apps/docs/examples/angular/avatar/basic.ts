import { Component } from '@angular/core';
import { SlAvatar } from '@slotted/angular/avatar';

@Component({
  selector: 'app-avatar-basic',
  imports: [SlAvatar],
  template: `<span slAvatar name="Maria Chen"></span>`,
})
export class AvatarBasic {}
