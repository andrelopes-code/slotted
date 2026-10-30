import { keyedProps, withSelectorKey } from '@slotted/core/selector-key';
import '@slotted/styles/prompt-composer/prompt-composer.css';
import '@slotted/styles/spinner/spinner.css';

import {
  promptComposerMessages,
  type FamilyTranslator,
  type PromptComposerMessages,
} from '@slotted/core/i18n';
import { appendPhrase, createDictation, dictationSupported } from '@slotted/core/dictation';
import type { Dictation } from '@slotted/core/dictation';
import { getLiveAnnouncer } from '@slotted/core/live-announcer';
import { createControllable } from '@slotted/core/state';
import { selectFiles } from '@slotted/core/upload';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type {
  ChangeEvent,
  ClipboardEvent,
  DragEvent,
  SubmitEvent,
  KeyboardEvent,
  MouseEvent,
  RefObject,
} from 'react';

import { useField } from '../field';
import { useMessages } from '../i18n';
import { Glyph, Icon } from '../icon';
import { usePromptComposerDefaults } from './prompt-composer-defaults';
import type {
  PromptComposerActionProps,
  PromptComposerAttachDetail,
  PromptComposerAttachProps,
  PromptComposerBandProps,
  PromptComposerDictateProps,
  PromptComposerInputProps,
  PromptComposerProps,
  PromptComposerRootProps,
  PromptComposerStatus,
  PromptComposerSubmitOn,
  PromptComposerSubmitProps,
  PromptComposerSubmitReason,
  PromptComposerValueReason,
} from './prompt-composer.types';
import { SPINNER_RING } from '../button/spinner-ring';

interface ComposerContext {
  attach: (
    files: readonly File[],
    reason: PromptComposerAttachDetail['reason'],
    source: unknown,
  ) => void;
  accept: string | undefined;
  canSubmit: boolean;
  describedBy: string | undefined;
  disabled: boolean | undefined;
  id: string | undefined;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  invalid: boolean | undefined;
  multiple: boolean;
  readOnly: boolean | undefined;
  required: boolean | undefined;
  setValue: (next: string, source: unknown) => void;
  /** Writes a phrase the reader spoke at the end of the value. */
  dictate: (phrase: string) => void;
  status: PromptComposerStatus;
  stop: (reason: PromptComposerSubmitReason, source: unknown) => void;
  submit: (reason: PromptComposerSubmitReason, source: unknown) => void;
  submitOn: PromptComposerSubmitOn;
  /** The family's words in the language in force, with this composer's `messages` laid over them. */
  t: FamilyTranslator<PromptComposerMessages>;
  value: string;
}

const Context = createContext<ComposerContext | null>(null);

function useComposer(part: string): ComposerContext {
  const context = useContext(Context);
  if (context === null) throw new Error(`PromptComposer${part} must sit inside a PromptComposer`);
  return context;
}

/** A click synthesised by the keyboard reports no detail; a real one the click count. */
function activationReason(event: MouseEvent): PromptComposerSubmitReason {
  return event.detail === 0 ? 'keyboard' : 'pointer';
}

/** Whether a drag carries files, rather than a selection of text. */
function carriesFiles(event: DragEvent): boolean {
  return Array.from(event.dataTransfer?.types ?? []).includes('Files');
}

/**
 * A message being written: a form around a textarea, a band above for what
 * the message carries and a band below for what it is sent with.
 *
 * **The value is the composer's.** The textarea is controlled from here, so an
 * accepted send can clear it with its own reason and a refused one leaves it
 * untouched. **The status is the application's**, because only the
 * application knows whether an answer is streaming; the send turns into a stop
 * while it is. **The attachments are the application's too**: they upload
 * while the reader writes, so the composer hands over the files — from its
 * button, a paste or a drop, after the selection rules `upload` applies — and
 * draws nothing of them.
 */
export function PromptComposer({
  accept,
  canSubmit,
  children,
  className,
  defaultValue,
  disabled,
  invalid,
  maxFiles,
  maxSize,
  messages,
  multiple = true,
  onAttach,
  onDragLeave,
  onDragOver,
  onDrop,
  onMouseDown,
  onStop,
  onSubmit,
  onValueChange,
  onValueSubmit,
  readOnly,
  render,
  size,
  status = 'ready',
  style,
  submitOn,
  value,
  emphasis,
  variant,
  ...nativeProps
}: PromptComposerProps) {
  const field = useField();
  const defaults = usePromptComposerDefaults();
  const t = useMessages(promptComposerMessages, messages);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [own, setOwn] = useState(defaultValue ?? '');
  const [dropTarget, setDropTarget] = useState(false);
  const current = value ?? own;

  const resolvedDisabled = disabled ?? field?.disabled;
  const resolvedReadOnly = readOnly ?? field?.readOnly;
  const resolvedInvalid = invalid ?? field?.invalid;
  const resolvedSize = size ?? field?.size ?? defaults.size;
  const busy = status === 'submitted' || status === 'streaming';
  const resolvedCanSubmit =
    resolvedDisabled !== true &&
    resolvedReadOnly !== true &&
    !busy &&
    (canSubmit ?? current.trim() !== '');

  const register = field?.registerControl;
  useEffect(() => register?.(), [register]);

  const announcer = () => getLiveAnnouncer(inputRef.current?.ownerDocument);

  /* The request travelling is announced once, as it starts. */
  const previousStatus = useRef(status);
  useEffect(() => {
    if (status === 'submitted' && previousStatus.current !== 'submitted') {
      announcer().announce(t('sending'));
    }
    previousStatus.current = status;
  });

  const request = (next: string, reason: PromptComposerValueReason, source: unknown) => {
    const state = createControllable<string>({
      controlled: value,
      initial: current,
      onRequest: (change) => onValueChange?.(change.value, change),
    });
    if (state.request(next, reason, source)) setOwn(next);
  };

  const submit = (reason: PromptComposerSubmitReason, source: unknown) => {
    if (!resolvedCanSubmit) return;
    let cancelled = false;
    const sent = current;
    const state = createControllable<string>({
      controlled: undefined,
      initial: '',
      onRequest: (change) => {
        onValueSubmit?.(change.value, change);
        cancelled = change.cancelled;
      },
      equals: () => false,
    });
    state.request(sent, reason, source);
    if (cancelled) return;
    request('', 'submit', source);
    inputRef.current?.focus();
  };

  const stop = (reason: PromptComposerSubmitReason, source: unknown) => {
    onStop?.({ reason, source });
    announcer().announce(t('stopped'));
    inputRef.current?.focus();
  };

  const attach = (
    files: readonly File[],
    reason: PromptComposerAttachDetail['reason'],
    source: unknown,
  ) => {
    if (files.length === 0 || resolvedDisabled === true || resolvedReadOnly === true) return;
    const outcome = selectFiles(files, [], { accept, maxFiles, maxSize, multiple });
    const accepted = outcome.files
      .filter((entry) => entry.status !== 'rejected' && entry.file !== undefined)
      .map((entry) => entry.file as File);
    onAttach?.(accepted, { reason, rejected: outcome.rejected, source });
  };

  const context: ComposerContext = {
    accept,
    attach,
    canSubmit: resolvedCanSubmit,
    describedBy: field?.describedBy,
    disabled: resolvedDisabled,
    id: field?.ids.control,
    inputRef,
    invalid: resolvedInvalid,
    multiple,
    readOnly: resolvedReadOnly,
    required: field?.required,
    setValue: (next, source) => request(next, 'keyboard', source),
    dictate: (phrase) => request(appendPhrase(current, phrase), 'dictation', undefined),
    status,
    stop,
    submit,
    submitOn: submitOn ?? defaults.submitOn,
    t,
    value: current,
  };

  const ringed = (emphasis ?? defaults.emphasis) === 'ring';
  const rootProps: PromptComposerRootProps = keyedProps({
    ...nativeProps,
    children: ringed ? (
      <>
        {children}
        <span aria-hidden="true" data-part="glow" data-part-glow="" />
        <span aria-hidden="true" data-part="ring" data-part-ring="" />
      </>
    ) : (
      children
    ),
    className,
    style,
    ...(resolvedDisabled === true ? { 'data-disabled': '' } : {}),
    ...(dropTarget ? { 'data-drop-target': '' } : {}),
    ...(ringed ? { 'data-emphasis': 'ring' as const } : {}),
    ...(resolvedInvalid === true ? { 'data-invalid': '' } : {}),
    ...(busy ? { 'data-loading': '' } : {}),
    ...(resolvedReadOnly === true ? { 'data-readonly': '' } : {}),
    'data-part': 'root',
    'data-size': resolvedSize,
    'data-status': status,
    'data-ui': 'prompt-composer',
    'data-variant': variant ?? defaults.variant,
    /* A press on the frame's padding or a band's empty space puts the caret
       in the value, which is what the text cursor over them promises. */
    onMouseDown: (event: MouseEvent<HTMLFormElement>) => {
      onMouseDown?.(event);
      const target = event.target as HTMLElement;
      const part = target.getAttribute('data-part');
      if (event.defaultPrevented || !(part === 'root' || part === 'header' || part === 'footer')) {
        return;
      }
      event.preventDefault();
      inputRef.current?.focus();
    },
    onSubmit: (event: SubmitEvent<HTMLFormElement>) => {
      onSubmit?.(event);
      if (event.defaultPrevented) return;
      event.preventDefault();
      submit('keyboard', event.nativeEvent);
    },
    onDragOver: (event: DragEvent<HTMLFormElement>) => {
      onDragOver?.(event);
      if (!carriesFiles(event) || resolvedDisabled === true || resolvedReadOnly === true) return;
      event.preventDefault();
      if (!dropTarget) setDropTarget(true);
    },
    onDragLeave: (event: DragEvent<HTMLFormElement>) => {
      onDragLeave?.(event);
      const next = event.relatedTarget as Node | null;
      if (next === null || !event.currentTarget.contains(next)) setDropTarget(false);
    },
    onDrop: (event: DragEvent<HTMLFormElement>) => {
      onDrop?.(event);
      setDropTarget(false);
      if (!carriesFiles(event)) return;
      event.preventDefault();
      attach(Array.from(event.dataTransfer.files), 'drop', event.nativeEvent);
    },
  });

  return (
    <Context.Provider value={context}>
      {render === undefined ? <form {...rootProps} /> : render(rootProps)}
    </Context.Provider>
  );
}

/** The band above the value: attachments, a quoted reply, a context chip. */
export function PromptComposerHeader({ render, ...nativeProps }: PromptComposerBandProps) {
  const props = keyedProps({ ...nativeProps, 'data-part': 'header' });
  return render === undefined ? <div {...props} /> : render(props);
}

/** The band below the value: tools on the start, the send at the end. */
export function PromptComposerFooter({ render, ...nativeProps }: PromptComposerBandProps) {
  const props = keyedProps({ ...nativeProps, 'data-part': 'footer' });
  return render === undefined ? <div {...props} /> : render(props);
}

/**
 * The value. Enter sends unless `submitOn` is `mod-enter`; Mod+Enter always
 * sends; Shift+Enter is the platform's line break; and nothing is sent while
 * an input method is composing, because there Enter confirms the composition.
 */
export function PromptComposerInput({
  'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid,
  'aria-required': ariaRequired,
  id,
  maxLength,
  maxRows,
  onChange,
  onKeyDown,
  onPaste,
  rows,
  showCount = false,
  style,
  ...nativeProps
}: PromptComposerInputProps) {
  const composer = useComposer('Input');
  const field = useField();

  const setCount = field?.setCount;
  useEffect(() => {
    if (!showCount || setCount === undefined) return;
    setCount({ length: composer.value.length, max: maxLength ?? undefined });
    return () => setCount(undefined);
  }, [composer.value, maxLength, setCount, showCount]);

  return (
    <textarea
      {...withSelectorKey(nativeProps, 'part', 'input')}
      aria-describedby={[describedBy, composer.describedBy].filter(Boolean).join(' ') || undefined}
      aria-invalid={ariaInvalid ?? (composer.invalid === true ? true : undefined)}
      aria-required={ariaRequired ?? (composer.required === true ? true : undefined)}

      dir={nativeProps.dir ?? 'auto'}
      disabled={composer.disabled}
      id={id ?? composer.id}
      maxLength={maxLength}
      onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
        onChange?.(event);
        composer.setValue(event.currentTarget.value, event);
      }}
      onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || event.key !== 'Enter' || event.shiftKey) return;
        if (event.nativeEvent.isComposing || event.keyCode === 229) return;
        const mod = event.metaKey || event.ctrlKey;
        if (!mod && composer.submitOn !== 'enter') return;
        event.preventDefault();
        composer.submit('keyboard', event.nativeEvent);
      }}
      onPaste={(event: ClipboardEvent<HTMLTextAreaElement>) => {
        onPaste?.(event);
        const files = Array.from(event.clipboardData?.files ?? []);
        if (files.length === 0) return;
        /* Text that came with the files still pastes; files alone do not
           leave their names behind as text. */
        if (event.clipboardData.getData('text/plain') === '') event.preventDefault();
        composer.attach(files, 'paste', event.nativeEvent);
      }}
      readOnly={composer.readOnly}
      ref={(element: HTMLTextAreaElement | null) => {
        composer.inputRef.current = element;
        const { ref } = nativeProps;
        if (typeof ref === 'function') ref(element);
        else if (ref !== null && ref !== undefined) ref.current = element;
      }}
      rows={rows ?? 1}
      style={{
        ...(rows === undefined ? {} : { '--slotted-prompt-composer-rows': rows }),
        ...(maxRows === undefined ? {} : { '--slotted-prompt-composer-max-rows': maxRows }),
        ...style,
      }}
      value={composer.value}
    />
  );
}

/**
 * A button of the consumer's in a band: a model menu, a tool, Cancelar.
 * Square when named by `aria-label`, padded when named by its words; a
 * `MenuTrigger` hands it its wiring through its own `render`.
 */
export function PromptComposerAction({
  render,
  type = 'button',
  ...nativeProps
}: PromptComposerActionProps) {
  const props = keyedProps({ ...nativeProps, 'data-part': 'action' as const, type });
  return render === undefined ? <button {...props} /> : render(props);
}

/** The paperclip: opens the file chooser, with the composer's `accept` and `multiple`. */
export function PromptComposerAttach({
  'aria-label': ariaLabel,
  children,
  disabled,
  onClick,
  ...nativeProps
}: PromptComposerAttachProps) {
  const composer = useComposer('Attach');
  const picker = useRef<HTMLInputElement | null>(null);
  const off = disabled ?? (composer.disabled === true || composer.readOnly === true);

  return (
    <>
      <button
        {...withSelectorKey(nativeProps, 'part', 'attach')}
        aria-label={ariaLabel ?? composer.t('attach')}

        disabled={off}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) picker.current?.click();
        }}
        type="button"
      >
        {children ?? (
          <Icon>
            <Glyph name="paperclip" />
          </Icon>
        )}
      </button>
      <input
        accept={composer.accept}
        hidden
        multiple={composer.multiple}
        onChange={(event) => {
          composer.attach(
            Array.from(event.currentTarget.files ?? []),
            'pointer',
            event.nativeEvent,
          );
          /* The same file chosen twice is still a choice. */
          event.currentTarget.value = '';
        }}
        ref={picker}
        tabIndex={-1}
        type="file"
      />
    </>
  );
}

/**
 * The microphone: dictation through the platform's speech recognition. Each
 * final phrase is written at the end of the value with reason `dictation`;
 * the button is pressed while the engine listens, and a second press stops
 * it. Where the platform has no recognition engine it renders nothing.
 */
export function PromptComposerDictate({
  'aria-label': ariaLabel,
  children,
  disabled,
  lang,
  onClick,
  ...nativeProps
}: PromptComposerDictateProps) {
  const composer = useComposer('Dictate');
  /* Phrases arrive after the render that started the session: they write through the latest one. */
  const latest = useRef(composer);
  latest.current = composer;
  const session = useRef<Dictation | null>(null);
  const [listening, setListening] = useState(false);
  const [supported] = useState(() => dictationSupported());
  useEffect(() => () => session.current?.destroy(), []);
  if (!supported) return null;
  const off = disabled ?? (composer.disabled === true || composer.readOnly === true);

  return (
    <button
      {...withSelectorKey(nativeProps, 'part', 'dictate')}
      aria-label={ariaLabel ?? composer.t('dictate')}
      aria-pressed={listening}
      disabled={off}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (session.current?.listening) {
          session.current.stop();
          return;
        }
        const button = event.currentTarget;
        session.current = createDictation({
          lang: lang ?? button.closest('[lang]')?.getAttribute('lang') ?? undefined,
          onListeningChange: (next) => {
            setListening(next);
            if (next) getLiveAnnouncer(button.ownerDocument).announce(composer.t('listening'));
          },
          onPhrase: (phrase) => latest.current.dictate(phrase),
        });
        session.current?.start();
      }}
      type="button"
    >
      {children ?? (
        <Icon>
          <Glyph name="mic" />
        </Icon>
      )}
    </button>
  );
}

/**
 * The send. Round and named by the provider's label for the status it is in;
 * a padded word when given children. It turns into a busy ring while the
 * request travels, a stop inside the ring while the answer streams, and a
 * retry after an error.
 */
export function PromptComposerSubmit({
  'aria-label': ariaLabel,
  children,
  disabled,
  onClick,
  ...nativeProps
}: PromptComposerSubmitProps) {
  const composer = useComposer('Submit');
  const { status, t } = composer;
  const streaming = status === 'streaming';
  const submitted = status === 'submitted';

  const label = streaming
    ? t('stop')
    : submitted
      ? t('sending')
      : status === 'error'
        ? t('retry')
        : t('send');
  const glyph = status === 'error' ? 'rotate-ccw' : 'arrow-up';

  return (
    <button
      {...withSelectorKey(nativeProps, 'part', 'submit')}
      aria-disabled={submitted ? true : undefined}
      aria-label={children === undefined ? (ariaLabel ?? label) : ariaLabel}

      disabled={streaming ? false : (disabled ?? (!submitted && !composer.canSubmit))}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        event.preventDefault();
        if (streaming) composer.stop(activationReason(event), event.nativeEvent);
        else if (!submitted) composer.submit(activationReason(event), event.nativeEvent);
      }}
      type={streaming || submitted ? 'button' : 'submit'}
    >
      {children ??
        (submitted ? (
          <span aria-hidden="true" data-ui="spinner" data-ui-spinner="" key="busy">
            {SPINNER_RING}
          </span>
        ) : streaming ? (
          <>
            <span aria-hidden="true" data-ui="spinner" data-ui-spinner="" key="ring">
              {SPINNER_RING}
            </span>
            <Icon key="stop">
              <Glyph name="stop" />
            </Icon>
          </>
        ) : (
          <Icon key={glyph}>
            <Glyph name={glyph} />
          </Icon>
        ))}
    </button>
  );
}
