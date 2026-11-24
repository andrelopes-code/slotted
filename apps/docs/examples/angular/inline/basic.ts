import { Component } from '@angular/core';
import { SlAvatar } from '@slotted/angular/avatar';
import { SlBadge } from '@slotted/angular/badge';
import { SlInline } from '@slotted/angular/inline';
import { SlText } from '@slotted/angular/typography';

@Component({
  selector: 'app-inline-basic',
  imports: [SlAvatar, SlBadge, SlInline, SlText],
  template: `
    <div slInline>
      <span slAvatar name="Maria Chen"></span>
      <span slText weight="semibold">Maria Chen</span>
      <span slBadge tone="success">Approver</span>
      <span slBadge tone="info">Finance</span>
    </div>
  `,
})
export class InlineBasic {}
