import { InjectionToken } from '@angular/core';
import type { Signal } from '@angular/core';

/**
 * What a member is, to the group that holds it: a name, and a place in the row.
 *
 * The token exists so an item can ask the group whether it is beyond the limit
 * without importing the group, which imports the item for its own content
 * query. One direction each way is what keeps the two files out of a cycle.
 */
export interface AvatarGroupMember {
  /** The member's own name, read from the avatar inside it. */
  readonly memberName: Signal<string | undefined>;
}

export interface AvatarGroupHost {
  isHiddenMember(member: AvatarGroupMember): boolean;
}

export const AVATAR_GROUP = new InjectionToken<AvatarGroupHost>('slotted avatar group');
