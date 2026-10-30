import { computed, contentChild, Directive, inject } from '@angular/core';
import { SlAvatar } from '@slotted/angular/avatar';

import { AVATAR_GROUP } from './avatar-group-host';

/**
 * One member of the group: the list item that holds an avatar.
 *
 * React wraps each child itself, because it can. Angular cannot wrap projected
 * content one node at a time, so the item is written in the template — which is
 * the more honest of the two anyway: the `<li>` is the consumer's element, and
 * `*ngFor` puts it where the data says.
 *
 * A member past the group's limit is `hidden`, which takes it out of the layout
 * and out of the accessibility tree in one attribute. Its name is not lost: the
 * group reads it from here and puts it on the summary.
 */
@Directive({
  selector: 'li[slAvatarGroupItem]',
  standalone: true,
  exportAs: 'slAvatarGroupItem',
  host: {
    'data-part': 'item',
    'data-part-item': '',
    '[attr.hidden]': "hidden() ? '' : null",
  },
})
export class SlAvatarGroupItem {
  private readonly group = inject(AVATAR_GROUP);
  private readonly avatar = contentChild(SlAvatar);

  /** What the group calls this member when it has to summarize it away. */
  readonly memberName = computed(() => this.avatar()?.name());

  protected readonly hidden = computed(() => this.group.isHiddenMember(this));
}
