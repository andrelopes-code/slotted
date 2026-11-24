import { Component } from '@angular/core';
import { SlAvatar, SlAvatarFallback } from '@slotted/angular/avatar';
import { SlGlyph, SlIcon } from '@slotted/angular/icon';
import { SlInline } from '@slotted/angular/inline';

@Component({
  selector: 'app-avatar-fallback',
  imports: [SlAvatar, SlAvatarFallback, SlGlyph, SlIcon, SlInline],
  template: `
    <div slInline align="center" [gap]="4">
      <span slAvatar name="Maria Chen" size="lg"></span>
      <span slAvatar size="lg"></span>
      <span slAvatar name="Receiving dock" shape="square" size="lg" tone="info">
        <span slIcon slAvatarFallback><svg slGlyph name="inbox"></svg></span>
      </span>
    </div>
  `,
})
export class AvatarFallback {}
