import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
  ViewEncapsulation,
} from '@angular/core';

export type AvatarSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'span[slAvatar]',
  standalone: true,
  template: '<ng-content></ng-content>',
  styleUrl: '../../../styles/src/avatar/avatar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'slotted-avatar',
    'data-slotted-component': 'avatar',
    'data-part': 'root',
    '[attr.data-size]': 'size()',
    '[attr.data-loaded]': "loaded() ? '' : null",
  },
})
export class SlAvatar {
  readonly size = input<AvatarSize>('md');

  private readonly loadedState = signal(false);

  readonly loaded = this.loadedState.asReadonly();

  setLoaded(loaded: boolean) {
    this.loadedState.set(loaded);
  }
}
