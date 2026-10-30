import { inject, InjectionToken } from '@angular/core';

/**
 * Which of the five semantic colors the fallback is painted in. `auto` derives
 * it from the name, so the same person keeps the same color in a list that is
 * re-sorted and in a table that is paged.
 */
export type AvatarTone =
  'auto' | 'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger';

/** The palette `auto` chooses from, in the order the hash indexes it. */
export type AvatarResolvedTone = Exclude<AvatarTone, 'auto'>;

/** How that color is painted. `soft` is the tinted disc an avatar usually is. */
export type AvatarVariant = 'soft' | 'solid';
/**
 * The ground behind the avatar. `tone` paints the tone behind the fallback and
 * nothing behind a loaded picture; `none` paints nothing; `plate` paints a
 * light plate in every scheme, for a logo designed for a white ground.
 */
export type AvatarSurface = 'tone' | 'none' | 'plate';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** A circle is a person; a square is a team, an organization or a bot. */
export type AvatarShape = 'circle' | 'square';

/** Where the picture is. Four values, because a boolean cannot say why there is none. */
export type AvatarStatus = 'idle' | 'loading' | 'loaded' | 'error';

export type AvatarGroupLayout = 'stack' | 'spread';

export interface AvatarDefaults {
  /** BCP 47. Used to case the initials, and by the group to join names. */
  locale: string | undefined;
  shape: AvatarShape;
  size: AvatarSize;
  tone: AvatarTone;
  variant: AvatarVariant;
}

const FALLBACK: AvatarDefaults = {
  locale: undefined,
  shape: 'circle',
  size: 'md',
  tone: 'auto',
  variant: 'soft',
};

export const AVATAR_DEFAULTS = new InjectionToken<AvatarDefaults>('slotted avatar defaults', {
  providedIn: 'root',
  factory: () => FALLBACK,
});

/**
 * An application decides once how its avatars are shaped, how large they are,
 * how they are painted and — the one that matters most — which locale cases
 * their initials, rather than repeating four inputs on every avatar. An avatar
 * that states any of them itself still wins: an explicit input is never
 * overridden by the token.
 *
 * `SlAvatarGroup` provides the same token rather than a channel of its own,
 * which is what keeps a member's explicit `size` winning over the group's.
 */
export function provideAvatarDefaults(defaults: Partial<AvatarDefaults>) {
  return {
    provide: AVATAR_DEFAULTS,
    useFactory: (): AvatarDefaults => ({
      locale: defaults.locale ?? FALLBACK.locale,
      shape: defaults.shape ?? FALLBACK.shape,
      size: defaults.size ?? FALLBACK.size,
      tone: defaults.tone ?? FALLBACK.tone,
      variant: defaults.variant ?? FALLBACK.variant,
    }),
  };
}

/** What an avatar renders as here, before it states anything of its own. */
export function injectAvatarDefaults(): AvatarDefaults {
  return inject(AVATAR_DEFAULTS);
}
