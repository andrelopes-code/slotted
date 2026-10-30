import { keyedProps } from '@slotted/core/selector-key';
import { useCallback, useRef } from 'react';
import type { Ref } from 'react';

import { Button } from '../button/button';
import { IconButton } from '../button/icon-button';
import { Glyph, Icon } from '../icon';
import type { ButtonRootProps, IconButtonProps } from '../button/button.types';
import { Menu } from '../menu/menu';
import { MenuRadioGroup } from '../menu/menu-items';
import { MenuTrigger } from '../menu/menu-parts';
import type { PartRef } from '../menu/menu.types';
import { useSplitButton } from './split-button';
import type {
  SplitButtonChoicesProps,
  SplitButtonMenuProps,
  SplitButtonMenuTriggerProps,
  SplitButtonPrimaryProps,
} from './split-button.types';

function attach<T>(node: T, ...refs: (Ref<T> | undefined)[]) {
  for (const ref of refs) {
    if (typeof ref === 'function') ref(node);
    else if (ref !== null && ref !== undefined) ref.current = node;
  }
}

/**
 * The action: `button`'s Button, carrying this family's part. `button`
 * selects itself by `data-ui` alone and reads no part on its root, so the
 * part slot is free, and it is written after Button has written its own —
 * through `render`, which is the one place a consumer's own `render` is
 * composed with rather than replaced.
 *
 * `disabled` and `loading` are the root's, and the half's own `disabled` adds
 * to them: PrimeNG's `buttonDisabled` is the native attribute here.
 */
export function SplitButtonPrimary({
  disabled = false,
  loading = false,
  render,
  ...nativeProps
}: SplitButtonPrimaryProps) {
  const family = useSplitButton();

  return (
    <Button
      {...nativeProps}
      disabled={disabled || family.disabled}
      loading={loading || family.loading}
      render={(props: ButtonRootProps) => {
        const rootProps = keyedProps({ ...props, 'data-part': 'primary' }) as ButtonRootProps;
        return render === undefined ? <button {...rootProps} /> : render(rootProps);
      }}
    />
  );
}

/**
 * The menu's state owner: `Menu` itself, rendered around the trigger and the
 * consumer's `MenuContent`. `open`, `defaultOpen` and `onOpenChange` reach it
 * unchanged, so the family adds no second owner of that state, and the
 * handle is `menu`'s — `open()`, `close()`, `focus()`.
 *
 * While the action is in flight the menu is disabled: choosing "Save as
 * draft" while "Save" runs is a double submission. The trigger says so with
 * `aria-disabled` and keeps its paint.
 */
export function SplitButtonMenu({ children, disabled, ref, ...menuProps }: SplitButtonMenuProps) {
  const family = useSplitButton();
  const resolvedDisabled = disabled || family.disabled || family.loading;

  return (
    <Menu
      {...menuProps}
      {...(resolvedDisabled ? { disabled: true } : {})}
      {...(ref === undefined ? {} : { ref })}
    >
      {children}
    </Menu>
  );
}

/**
 * The menu trigger: `button`'s IconButton rendered as `menu`'s trigger, so
 * it carries `aria-haspopup`, `aria-expanded`, `aria-controls` and the four
 * keys of the Menu Button pattern from `menu`, and every tone, variant and
 * size from `button`. The chevron is the family's, the `chevron-down` Glyph
 * element in the icon part, which `button` sizes; children the consumer
 * passes replace it. The accessible name is the consumer's and the type
 * requires it.
 *
 * The ref `menu` hands to `render` is the anchor the positioner measures
 * against, so it is attached beside the consumer's rather than replaced —
 * the rule `docs/build-briefing.md` records from `toolbar`'s overflow.
 *
 * The menu is disabled while the root is disabled or loading, and `menu`'s
 * trigger then writes `data-disabled`. That attribute is dropped here:
 * `button` writes its own from the native `disabled`, and while the root is
 * only loading none is wanted — the bar is one control that is busy, not one
 * half working beside one half broken — so `aria-disabled` is what stays.
 */
export function SplitButtonMenuTrigger({
  children,
  disabled = false,
  ref,
  render,
  ...nativeProps
}: SplitButtonMenuTriggerProps) {
  const family = useSplitButton();
  const anchor = useRef<PartRef | undefined>(undefined);
  const setNode = useCallback(
    (element: HTMLButtonElement | null) => {
      attach<HTMLElement | null>(element, anchor.current);
      attach(element, ref);
    },
    [ref],
  );

  /* The consumer's own handlers go through `menu`'s trigger, which composes
     them with its own rather than replacing them; what comes back carries
     both, and `button` composes its activation guard over that. */
  return (
    <MenuTrigger
      {...nativeProps}
      render={({ ref: anchorRef, 'data-disabled': menuDisabled, ...triggerProps }) => {
        anchor.current = anchorRef;
        void menuDisabled;

        return (
          <IconButton
            {...(triggerProps as IconButtonProps)}
            disabled={disabled || family.disabled}
            ref={setNode}
            render={(props: ButtonRootProps) => {
              /* `button` writes `aria-disabled` from its own inertness and
                 would clear the one `menu` wrote for a disabled menu; while
                 the root is loading the menu is disabled and the trigger has
                 to say so, so it is written back after `button`'s own. */
              const rootProps = keyedProps({
                ...props,
                ...(family.loading ? { 'aria-disabled': true } : {}),
                'data-part': 'menu-trigger',
              }) as ButtonRootProps;
              return render === undefined ? <button {...rootProps} /> : render(rootProps);
            }}
            shape="square"
          >
            {children ?? (
              <Icon>
                <Glyph name="chevron-down" />
              </Icon>
            )}
          </IconButton>
        );
      }}
    />
  );
}

/**
 * The alternatives under `remember`: `menu`'s radio group bound to the
 * family's value. The consumer writes `MenuRadioItem`s inside it and nothing
 * else — the value the reader chooses is the value the primary reads.
 */
export function SplitButtonChoices({ children, ...nativeProps }: SplitButtonChoicesProps) {
  const family = useSplitButton();
  if (!family.remember) {
    throw new Error('SplitButtonChoices needs a SplitButton with `remember`.');
  }

  return (
    <MenuRadioGroup
      {...nativeProps}
      onValueChange={(value, request) => family.select(value, request.reason, request.source)}
      value={family.value}
    >
      {children}
    </MenuRadioGroup>
  );
}
