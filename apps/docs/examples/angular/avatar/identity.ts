import { Component } from '@angular/core';
import { SlAvatar } from '@slotted/angular/avatar';
import { SlInline } from '@slotted/angular/inline';
import { SlStack } from '@slotted/angular/stack';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-avatar-identity',
  imports: [SlAvatar, SlInline, SlStack, SlText],
  template: `
    <div slStack [gap]="4">
      <div slStack [gap]="2">
        <span slText size="sm" tone="muted">From the name</span>
        <div slInline [gap]="3">
          <span slAvatar name="Maria Chen"></span>
          <span slAvatar name="Marta Okafor"></span>
          <span slAvatar name="Jonas Weber"></span>
          <span slAvatar name="Elena Rossi"></span>
        </div>
      </div>
      <div slStack [gap]="2">
        <span slText size="sm" tone="muted">Same idFor, different names</span>
        <div slInline [gap]="3">
          <span slAvatar idFor="emp-1042" name="Maria Chen"></span>
          <span slAvatar idFor="emp-1042" name="M. Chen"></span>
        </div>
      </div>
      <div slStack [gap]="2">
        <span slText size="sm" tone="muted">Own initials</span>
        <div slInline [gap]="3">
          <span slAvatar initials="D4" name="Dock 4 inbound" shape="square"></span>
        </div>
      </div>
    </div>
  `,
})
export class AvatarIdentity {}
