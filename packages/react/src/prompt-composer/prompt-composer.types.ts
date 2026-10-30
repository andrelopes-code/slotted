import type { PartialMessages, PromptComposerMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type { UploadFile } from '@slotted/core/upload';
import type { ComponentPropsWithRef, ReactNode } from 'react';

/** The type step, matching the field around the composer. */
export type PromptComposerSize = 'sm' | 'md' | 'lg';

/**
 * `raised` is the chat composer, a surface lifted off the page; `outline` and
 * `subtle` are a composer inside a form, with a one-line control's geometry.
 */
export type PromptComposerVariant = 'raised' | 'outline' | 'subtle';

/** Whether Enter sends, or only Mod+Enter does. Shift+Enter always breaks a line. */
export type PromptComposerSubmitOn = 'enter' | 'mod-enter';

/**
 * Where the request the composer sent stands. The application owns it,
 * because only the application knows whether an answer is streaming.
 */
export type PromptComposerStatus = 'ready' | 'submitted' | 'streaming' | 'error';

/** Why the value moved: an edit, or the clearing that follows an accepted send. */
export type PromptComposerValueReason = Extract<
  ChangeRequest<string>['reason'],
  'keyboard' | 'submit' | 'dictation'
>;

/** Why a send or a stop was asked for. */
export type PromptComposerSubmitReason = Extract<
  ChangeRequest<string>['reason'],
  'keyboard' | 'pointer'
>;

/** Where files came from, and what the selection rules refused. */
export interface PromptComposerAttachDetail {
  reason: 'pointer' | 'paste' | 'drop';
  rejected: UploadFile[];
  source: unknown;
}

/**
 * `ring` marks an AI input with a ring of turning hues and a soft glow, which
 * replace its border, its focus outline and its raised shadow.
 */
export type PromptComposerEmphasis = 'none' | 'ring';

/** What an application sets once for every composer under it. */
export interface PromptComposerDefaults {
  emphasis: PromptComposerEmphasis;
  size: PromptComposerSize;
  submitOn: PromptComposerSubmitOn;
  variant: PromptComposerVariant;
}

export interface PromptComposerDefaultsProviderProps extends Partial<PromptComposerDefaults> {
  children?: ReactNode | undefined;
}

/** What `render` receives for the root. */
export interface PromptComposerRootProps extends ComponentPropsWithRef<'form'> {
  'data-disabled'?: '' | undefined;
  'data-drop-target'?: '' | undefined;
  'data-emphasis'?: 'ring' | undefined;
  'data-invalid'?: '' | undefined;
  'data-loading'?: '' | undefined;
  'data-part': 'root';
  'data-readonly'?: '' | undefined;
  'data-size': PromptComposerSize;
  'data-status': PromptComposerStatus;
  'data-ui': 'prompt-composer';
  'data-variant': PromptComposerVariant;
}

/**
 * The root is a `form`, and every native prop reaches it; `onSubmit` stays
 * the form's own event. The composer's own send is `onValueSubmit`.
 */
export interface PromptComposerProps extends Omit<
  ComponentPropsWithRef<'form'>,
  'defaultValue' | 'onChange'
> {
  /** The file types the attach button, a paste and a drop accept, as `accept` reads. */
  accept?: string | undefined;
  /**
   * Whether the send is available. Defaults to "the value has something
   * besides white space"; an application with attachments ready says `true`.
   */
  canSubmit?: boolean | undefined;
  children?: ReactNode | undefined;
  /** The value an uncontrolled composer starts from, read once. */
  defaultValue?: string | undefined;
  /** Unstated rather than `false`, so the composer defers to its field. */
  disabled?: boolean | undefined;
  invalid?: boolean | undefined;
  /** The most files one attach may bring. */
  maxFiles?: number | undefined;
  /** The largest file, in bytes. */
  maxSize?: number | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * names of the attach and submit buttons for each status (`send`, `sending`,
   * `stop`, `retry`), and the `sending` and `stopped` announcements.
   */
  messages?: PartialMessages<PromptComposerMessages> | undefined;
  /** Whether one attach may bring more than one file. Defaults to `true`. */
  multiple?: boolean | undefined;
  /** Files from the attach button, a paste or a drop, after the selection rules. */
  onAttach?: ((files: File[], detail: PromptComposerAttachDetail) => void) | undefined;
  /** The stop button, while `status` is `streaming`. */
  onStop?: ((detail: { reason: PromptComposerSubmitReason; source: unknown }) => void) | undefined;
  /** Called before the value moves, with the request that carries the reason. */
  onValueChange?: ((value: string, request: ChangeRequest<string>) => void) | undefined;
  /**
   * Called before the message is sent. `request.cancel()` keeps the value
   * where it is; otherwise an uncontrolled composer clears it, with reason
   * `submit`.
   */
  onValueSubmit?: ((value: string, request: ChangeRequest<string>) => void) | undefined;
  readOnly?: boolean | undefined;
  /** Renders the root into another element. */
  render?: ((props: PromptComposerRootProps) => ReactNode) | undefined;
  /** Defaults to the field, then to the provider, then to `md`. */
  size?: PromptComposerSize | undefined;
  /** Defaults to `ready`. */
  status?: PromptComposerStatus | undefined;
  /** Defaults to the provider, then to `enter`. */
  submitOn?: PromptComposerSubmitOn | undefined;
  /** Present means controlled, for the life of the component. */
  value?: string | undefined;
  /** Defaults to the provider, then to `raised`. */
  variant?: PromptComposerVariant | undefined;
  /** Defaults to the provider, then to `none`. */
  emphasis?: PromptComposerEmphasis | undefined;
}

/**
 * The textarea. Every native prop reaches it; `value`, `defaultValue` and
 * `onChange` are the composer's, because the composer owns the value.
 */
export interface PromptComposerInputProps extends Omit<
  ComponentPropsWithRef<'textarea'>,
  'defaultValue' | 'value'
> {
  /** The most lines the value grows to before it scrolls. Defaults to 8. */
  maxRows?: number | undefined;
  /** The fewest lines it shows. Defaults to 1. */
  rows?: number | undefined;
  /** Publishes the length of the value to the field, which draws the count. */
  showCount?: boolean | undefined;
}

export type PromptComposerBandProps = ComponentPropsWithRef<'div'> & {
  render?:
    ((props: ComponentPropsWithRef<'div'> & { 'data-part': string }) => ReactNode) | undefined;
};

export interface PromptComposerActionProps extends ComponentPropsWithRef<'button'> {
  render?:
    ((props: ComponentPropsWithRef<'button'> & { 'data-part': 'action' }) => ReactNode) | undefined;
}

export interface PromptComposerAttachProps extends Omit<
  ComponentPropsWithRef<'button'>,
  'children'
> {
  /** The mark; defaults to the paperclip. */
  children?: ReactNode | undefined;
}

export interface PromptComposerDictateProps extends Omit<
  ComponentPropsWithRef<'button'>,
  'children' | 'lang'
> {
  /** The mark; defaults to the microphone. */
  children?: ReactNode | undefined;
  /** The language the engine listens in, a BCP 47 tag. Defaults to the nearest `lang` attribute. */
  lang?: string | undefined;
}

export interface PromptComposerSubmitProps extends Omit<ComponentPropsWithRef<'button'>, 'type'> {
  /**
   * The send named by a word — Comentar, Publicar — instead of the round mark.
   * Absent, the button is the mark and its name is the provider's label for
   * the current status.
   */
  children?: ReactNode | undefined;
}
