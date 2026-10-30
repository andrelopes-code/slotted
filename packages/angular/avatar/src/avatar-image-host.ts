import { InjectionToken } from '@angular/core';

import type { AvatarStatus } from './avatar-defaults';

/**
 * What the picture tells the avatar it sits in.
 *
 * It is a token rather than the component's own class so that one directive can
 * serve both pictures the family knows about: the `<img>` the avatar renders
 * for its own `src`, and the `<img>` the consumer projects — which is the one
 * that carries `ngSrc`, and therefore the one `NgOptimizedImage` can reach. A
 * directive that injected the component directly would put a cycle between the
 * two files, and the component imports the directive for its own template.
 */
export interface AvatarImageHost {
  reportStatus(status: AvatarStatus): void;
}

export const AVATAR_IMAGE_HOST = new InjectionToken<AvatarImageHost>('slotted avatar image host');
