import { Component } from '@angular/core';
import { SlAvatar } from '@slotted/angular/avatar';
import { SlInline } from '@slotted/angular/inline';

@Component({
  selector: 'app-avatar-shapes',
  imports: [SlAvatar, SlInline],
  template: `
    <div slInline align="center" [gap]="4">
      <span slAvatar name="Maria Chen" shape="circle" size="lg"></span>
      <span slAvatar name="Night shift" shape="square" size="lg"></span>
      <span slAvatar name="Northwind Logistics" shape="square" size="lg"></span>
      <span slAvatar name="Replenishment bot" shape="square" size="lg"></span>
    </div>
  `,
})
export class AvatarShapes {}
