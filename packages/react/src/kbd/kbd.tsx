import '@slotted/styles/kbd/kbd.css';

import { keysMessages } from '@slotted/core/i18n';
import { resolveKey } from '@slotted/core/keys';

import { useMessages } from '../i18n';
import { KeyElement } from './key-element';
import { useKbdDefaults, useKbdGroup, useResolvedPlatform } from './kbd-defaults';
import type { KbdProps } from './kbd.types';

/**
 * One key of a keyboard, drawn so a reader can find it on theirs.
 *
 * It is not a control: nothing here is focusable, nothing answers hover, and
 * nothing binds a shortcut. Registering one is the application's, because WCAG
 * 2.2 2.1.4 Character Key Shortcuts can only be answered by whoever knows
 * whether the shortcut can be turned off.
 *
 * `keyName` is where the family does work rather than paint. Which legend the
 * reader's platform draws, and which word a screen reader hears in place of a
 * symbol, are two decisions every consumer would otherwise take again —
 * `@slotted/core/keys` is where both bindings take them once.
 */
export function Kbd({
  children,
  disabled,
  keyName,
  messages,
  platform,
  render,
  size,
  variant,
  ...nativeProps
}: KbdProps) {
  const defaults = useKbdDefaults();
  const group = useKbdGroup();
  const resolvedPlatform = useResolvedPlatform(platform ?? group?.platform);
  const t = useMessages(keysMessages, messages);

  const resolved =
    keyName === undefined
      ? undefined
      : resolveKey(keyName, {
          platform: resolvedPlatform,
          t,
          legends: defaults.legends,
          names: defaults.names,
        });

  return (
    <KeyElement
      disabled={disabled ?? group?.disabled ?? false}
      legend={children}
      nativeProps={nativeProps}
      platform={keyName === undefined ? undefined : resolvedPlatform}
      render={render}
      resolved={resolved}
      size={size ?? group?.size ?? defaults.size}
      variant={variant ?? group?.variant ?? defaults.variant}
    />
  );
}
