import type { ButtonMessages, PartialMessages } from '@slotted/core/i18n';
import type { DefinedProps } from '@slotted/core/selector-key';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';

import type {
  BUTTON_JUSTIFICATIONS,
  BUTTON_SHAPES,
  BUTTON_SIZES,
  BUTTON_TONES,
  BUTTON_VARIANTS,
} from './button.constants';

export type ButtonTone = (typeof BUTTON_TONES)[number];
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];
export type ButtonSize = (typeof BUTTON_SIZES)[number];
export type ButtonShape = (typeof BUTTON_SHAPES)[number];
export type ButtonJustify = (typeof BUTTON_JUSTIFICATIONS)[number];
export type ButtonType = 'button' | 'submit' | 'reset';

/** The three axes every member paints itself from. */
export interface ButtonAppearanceProps {
  fullWidth?: boolean | undefined;
  /**
   * Where the content sits along the inline axis. `between` sets the label at
   * the start and `end` at the inline end, as a field trigger reads; `start`
   * stays beside the label.
   */
  justify?: ButtonJustify | undefined;
  size?: ButtonSize | undefined;
  tone?: ButtonTone | undefined;
  variant?: ButtonVariant | undefined;
}

/**
 * What an application sets once for every button under it. Each axis is
 * optional: an unset one leaves each member its own default rather than
 * flattening four members into one appearance.
 */
export interface ButtonDefaults {
  size?: ButtonSize | undefined;
  tone?: ButtonTone | undefined;
  variant?: ButtonVariant | undefined;
}

export interface ButtonDefaultsProviderProps extends ButtonDefaults {
  children: ReactNode;
}

export interface ButtonContentProps {
  children: ReactNode;
  /** Content before the label in the reading order, mirrored in a right-to-left document. */
  start?: ReactNode;
  /** Content after the label in the reading order, mirrored in a right-to-left document. */
  end?: ReactNode;
}

/**
 * Being unavailable and being unreachable are two decisions, and the platform
 * only offers them together. A disabled `button` leaves the tab sequence, which
 * takes its tooltip and its explanation with it — so a control that has to stay
 * discoverable keeps its place and announces `aria-disabled` instead.
 */
export interface ButtonDisabledProps {
  disabled?: boolean | undefined;
  focusableWhenDisabled?: boolean | undefined;
}

export interface ButtonLoadingProps {
  loading?: boolean | undefined;
  /**
   * How long the wait must last before the indicator is drawn. The activation
   * is refused from the first millisecond either way; this is only about not
   * showing a spinner for an action that takes ninety of them.
   */
  loadingDelay?: number | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: what the
   * indicator announces itself as (`loading`). It is a progress bar, so it has a name.
   */
  messages?: PartialMessages<ButtonMessages> | undefined;
}

/**
 * A change is a request. It carries the value, the value it replaces, the
 * reason — `pointer` or `keyboard`, told apart by whether the activation came
 * from a real pointer — the originating event, and `cancel()`. The value comes
 * first because reading it is what almost every consumer does.
 */
export type PressedChangeHandler = (pressed: boolean, request: ChangeRequest<boolean>) => void;

export interface ButtonPressedProps {
  /**
   * The consumer's value. Passing it puts the state in controlled mode for
   * good. `undefined` is written explicitly rather than left to the optional
   * marker, because absence is what decides the mode and the two must not
   * become interchangeable under `exactOptionalPropertyTypes`.
   */
  pressed?: boolean | undefined;
  /** The value an uncontrolled toggle starts from, read once. */
  defaultPressed?: boolean | undefined;
  onPressedChange?: PressedChangeHandler | undefined;
}

export type ButtonRootProps = ComponentPropsWithRef<'button'>;

/**
 * Hands the root's own props to something else to render. It is how a consumer
 * puts this surface on a framework's link component, a tooltip trigger or a
 * menu trigger without the family growing a prop for each of them.
 */
export type ButtonRender<Props> = (rootProps: Props) => ReactElement;

export interface ButtonProps
  extends
    Omit<ComponentPropsWithRef<'button'>, 'children' | 'type'>,
    ButtonAppearanceProps,
    ButtonContentProps,
    ButtonDisabledProps,
    ButtonLoadingProps {
  render?: ButtonRender<ButtonRootProps> | undefined;
  type?: ButtonType | undefined;
}

interface ButtonLinkSharedProps extends ButtonAppearanceProps, ButtonContentProps {
  disabled?: boolean | undefined;
}

export type ButtonLinkRootProps = ComponentPropsWithRef<'a'>;

type NativeButtonLinkProps = ButtonLinkSharedProps &
  Omit<ComponentPropsWithRef<'a'>, keyof ButtonLinkSharedProps | 'href'> & {
    href: string;
    render?: never;
  };

type AdaptedButtonLinkProps = ButtonLinkSharedProps &
  Omit<ComponentPropsWithRef<'a'>, keyof ButtonLinkSharedProps | 'href'> & {
    href?: never;
    /** Hands the root props to a router's own link component. */
    render: ButtonRender<DefinedProps<ButtonLinkRootProps>>;
  };

export type ButtonLinkProps = NativeButtonLinkProps | AdaptedButtonLinkProps;

/**
 * An icon carries no text, so the name cannot be computed from the content.
 * The union makes a naming attribute mandatory at the type level rather than
 * at run time. It requires at least one, not exactly one: a trigger's root
 * props type `aria-labelledby` as an optional string, and forbidding it would
 * refuse every trigger an icon button is composed onto. When both arrive,
 * `aria-labelledby` names the button, as accessible-name computation says.
 *
 * The second branch takes a stated `aria-labelledby` whose value may be
 * `undefined`: a tooltip trigger always states the key, and under
 * `describes="label"` fills it with the tooltip, which is then the button's
 * only name. Leaving both keys out is still refused.
 */
type IconButtonAccessibleName =
  | { 'aria-label': string; 'aria-labelledby'?: string | undefined }
  | { 'aria-label'?: string | undefined; 'aria-labelledby': string | undefined };

export type IconButtonProps = Omit<
  ComponentPropsWithRef<'button'>,
  'aria-label' | 'aria-labelledby' | 'aria-pressed' | 'children' | 'type'
> &
  Omit<ButtonAppearanceProps, 'fullWidth' | 'justify'> &
  ButtonDisabledProps &
  ButtonLoadingProps &
  ButtonPressedProps &
  IconButtonAccessibleName & {
    children: ReactNode;
    render?: ButtonRender<ButtonRootProps> | undefined;
    shape?: ButtonShape | undefined;
    type?: ButtonType | undefined;
  };

export interface ToggleButtonProps
  extends
    Omit<ComponentPropsWithRef<'button'>, 'aria-pressed' | 'children' | 'type'>,
    ButtonAppearanceProps,
    ButtonContentProps,
    ButtonDisabledProps,
    ButtonLoadingProps,
    ButtonPressedProps {
  render?: ButtonRender<ButtonRootProps> | undefined;
  type?: ButtonType | undefined;
}

interface IconButtonLinkSharedProps extends Omit<ButtonAppearanceProps, 'fullWidth' | 'justify'> {
  children: ReactNode;
  disabled?: boolean | undefined;
  shape?: ButtonShape | undefined;
}

type IconButtonLinkAnchorProps = Omit<
  ComponentPropsWithRef<'a'>,
  keyof IconButtonLinkSharedProps | 'aria-label' | 'aria-labelledby' | 'href'
> &
  IconButtonLinkSharedProps &
  IconButtonAccessibleName;

/**
 * An icon-only control that navigates: IconButton's surface and name on an
 * anchor, as ButtonLink is Button's. `render` hands it anchor props, so a
 * router's link component takes them as they are.
 */
export type IconButtonLinkProps =
  | (IconButtonLinkAnchorProps & { href: string; render?: never })
  | (IconButtonLinkAnchorProps & {
      href?: never;
      /** Hands the root props to a router's own link component. */
      render: ButtonRender<DefinedProps<ButtonLinkRootProps>>;
    });
