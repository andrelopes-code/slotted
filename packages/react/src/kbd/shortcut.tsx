import { keyedProps } from '@slotted/core/selector-key';
import '@slotted/styles/kbd/kbd.css';

import { Fragment } from 'react';

import { keysMessages } from '@slotted/core/i18n';
import { resolveShortcut } from '@slotted/core/keys';

import { useMessages } from '../i18n';
import { KeyElement } from './key-element';
import { KbdGroupContext, useKbdDefaults, useResolvedPlatform } from './kbd-defaults';
import type { KbdShortcutRootProps, ShortcutProps } from './kbd.types';

/**
 * A whole key combination, and the element the HTML Standard says it is:
 * “nesting a `kbd` element within another `kbd` element represents an actual key
 * or other unit of input as a portion of a larger input”. shadcn's `KbdGroup` is
 * a `div`, and Chakra and Radix put the whole combination inside one `kbd` as
 * text; this is the markup the specification describes.
 *
 * `keys` is written once and rendered for the reader's platform. The modifiers
 * are reordered into that platform's own convention — the Apple Style Guide
 * writes Fn, Control, Option, Shift, Command, and Microsoft writes the Windows
 * key ahead of Ctrl, Alt and Shift — so one authored string is right on both.
 * The escape hatch is composition rather than a fifth prop: a `Shortcut` whose
 * keys are written by hand is rendered exactly as written.
 */
export function Shortcut({
  children,
  disabled,
  keys,
  legends,
  messages,
  names,
  platform,
  render,
  separator,
  size,
  variant,
  ...nativeProps
}: ShortcutProps) {
  const defaults = useKbdDefaults();
  const resolvedPlatform = useResolvedPlatform(platform);
  const t = useMessages(keysMessages, messages);
  const resolvedSize = size ?? defaults.size;
  const resolvedVariant = variant ?? defaults.variant;

  const resolved =
    keys === undefined
      ? undefined
      : resolveShortcut(keys, {
          platform: resolvedPlatform,
          t,
          legends: legends ?? defaults.legends,
          names: names ?? defaults.names,
          separator: separator ?? defaults.separator,
        });

  /**
   * A shortcut with neither keys nor content renders nothing at all, rather
   * than an empty cap at the end of a row announcing that a shortcut exists.
   */
  if (resolved === undefined && children === undefined) return null;
  if (resolved !== undefined && resolved.steps.length === 0) return null;

  const content =
    resolved === undefined
      ? children
      : resolved.steps.map((step, stepIndex) => (
          <Fragment key={`step-${String(stepIndex)}`}>
            {stepIndex === 0 ? null : (
              /* Read aloud: it is the only thing that tells a sequence from a combination. */
              <span data-part="separator" data-part-separator="" data-separator="then">
                {resolved.thenLabel}
              </span>
            )}
            {step.map((key, keyIndex) => (
              <Fragment key={`key-${String(keyIndex)}-${key.legend}`}>
                {keyIndex === 0 || resolved.separator === '' ? null : (
                  /* Punctuation joining two caps. “Command Shift K” is what the platforms announce. */
                  <span
                    aria-hidden="true"
                    data-part="separator"
                    data-part-separator=""
                    data-separator="plus"
                  >
                    {resolved.separator}
                  </span>
                )}
                <KeyElement
                  disabled={disabled ?? false}
                  legend={undefined}
                  nativeProps={{}}
                  platform={resolvedPlatform}
                  render={undefined}
                  resolved={key}
                  size={resolvedSize}
                  variant={resolvedVariant}
                />
              </Fragment>
            ))}
          </Fragment>
        ));

  const rootProps: KbdShortcutRootProps = keyedProps({
    ...nativeProps,
    children: content,
    'data-part': 'shortcut',
    'data-platform': resolvedPlatform,
    'data-size': resolvedSize,
    'data-ui': 'kbd',
    'data-variant': resolvedVariant,
    ...(disabled === true ? { 'data-disabled': '' as const } : {}),
  });

  /**
   * The axes reach a key a consumer authored by hand inside this group, so a
   * `Shortcut` and the `Kbd` children someone wrote into it are painted the
   * same. Only what this element was told is passed on: a key that states its
   * own size still wins, and a group that states nothing hands on nothing.
   */
  return (
    <KbdGroupContext.Provider value={{ platform, size, variant, disabled }}>
      {render === undefined ? <kbd {...rootProps} /> : render(rootProps)}
    </KbdGroupContext.Provider>
  );
}
