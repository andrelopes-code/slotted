import { keyedProps } from '@slotted/core/selector-key';
import { formatBytes } from '@slotted/core/upload';
import { useState } from 'react';
import type { MouseEvent } from 'react';

import { Glyph, Icon } from '../icon';
import { ProgressBar } from '../progress-indicator';
import { useAttachment, useDescribes } from './attachment';
import { ATTACHMENT_KIND_GLYPH, extensionLabel } from './attachment-kinds';
import type {
  AttachmentActionProps,
  AttachmentActionRootProps,
  AttachmentFilenameProps,
  AttachmentLinkProps,
  AttachmentLinkRootProps,
  AttachmentPartProps,
  AttachmentPartRootProps,
  AttachmentPreviewProps,
  AttachmentPreviewRootProps,
  AttachmentProgressProps,
  AttachmentTextProps,
  AttachmentTriggerProps,
  AttachmentTriggerRootProps,
} from './attachment.types';

/**
 * The kind's tile with the kind's mark knocked out of it, or the thumbnail
 * the page gives. A thumbnail that fails to load returns to the tile: the
 * failure is this part's own state, not a state of the file.
 *
 * Hidden from assistive technology, because the file name already says what
 * the file is and the tile would say it a second time.
 */
export function AttachmentPreview({
  children,
  render,
  src,
  ...nativeProps
}: AttachmentPreviewProps) {
  const attachment = useAttachment();
  const [failed, setFailed] = useState<string | null>(null);
  const picture = src !== undefined && failed !== src;

  const rootProps: AttachmentPreviewRootProps = keyedProps({
    'aria-hidden': true,
    ...nativeProps,
    children:
      children ??
      (picture ? (
        <img alt="" decoding="async" loading="lazy" onError={() => setFailed(src)} src={src} />
      ) : (
        <Icon>
          <Glyph name={ATTACHMENT_KIND_GLYPH[attachment.kind]} />
        </Icon>
      )),
    'data-extension': extensionLabel(attachment.extension, attachment.t('noExtension')),
    'data-kind': attachment.kind,
    'data-part': 'preview',
  });

  return render === undefined ? <span {...rootProps} /> : render(rootProps);
}

/** The text column, and the one box in the attachment that may shrink. */
export function AttachmentBody({ render, ...nativeProps }: AttachmentPartProps) {
  const rootProps: AttachmentPartRootProps = keyedProps({ ...nativeProps, 'data-part': 'body' });
  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}

/**
 * The file name as two runs — the stem, which shrinks to an ellipsis, and the
 * extension, which does not — laid out in the name's own direction.
 */
export function AttachmentFilename({ children, render, ...nativeProps }: AttachmentFilenameProps) {
  const { extension, stem } = useAttachment();

  const rootProps: AttachmentPartRootProps = keyedProps({
    dir: 'auto',
    ...nativeProps,
    children: children ?? (
      <>
        <span data-part="name" data-part-name="">
          {stem}
        </span>
        {extension === '' ? null : (
          <span data-part="extension" data-part-extension="">
            {extension}
          </span>
        )}
      </>
    ),
    'data-part': 'filename',
  });

  return render === undefined ? <span {...rootProps} /> : render(rootProps);
}

/**
 * What both triggers share: the refusal, and a description that names the
 * page's own `aria-describedby` first and then the detail and the message
 * that are on the page.
 */
function useTriggerWiring(ariaDescribedBy: string | undefined) {
  const attachment = useAttachment();
  const ids = [
    ...(ariaDescribedBy === undefined ? [] : [ariaDescribedBy]),
    ...(attachment.described.detail === null ? [] : [attachment.described.detail]),
    ...(attachment.described.message === null ? [] : [attachment.described.message]),
  ];
  return {
    attachment,
    blocked: attachment.disabled || attachment.loading,
    describedBy: ids.length === 0 ? undefined : ids.join(' '),
  };
}

/**
 * The file's target when the page opens it itself — a viewer, a preview
 * dialog. A real `button`: `disabled` while the file is loading or
 * unavailable, which also refuses the duplicate open. Its name is the file
 * name, and its description the detail and the message.
 */
export function AttachmentTrigger({
  'aria-describedby': ariaDescribedBy,
  children,
  render,
  type = 'button',
  ...nativeProps
}: AttachmentTriggerProps) {
  const { attachment, blocked, describedBy: description } = useTriggerWiring(ariaDescribedBy);

  const rootProps: AttachmentTriggerRootProps = keyedProps({
    title: attachment.file.name,
    ...nativeProps,
    ...(description === undefined ? {} : { 'aria-describedby': description }),
    children: children ?? <AttachmentFilename />,
    'data-part': 'trigger',
    disabled: blocked || nativeProps.disabled === true,
    type,
  });

  return render === undefined ? <button {...rootProps} /> : render(rootProps);
}

/**
 * The file's target when it has an address. A real `a`, so `href`,
 * `download` and the modified click a browser gives a link stay the
 * platform's. While the file is loading or unavailable it takes
 * `aria-disabled="true"`, keeps its destination and refuses the activation —
 * perceivable, not operable — which is `list-item`'s rule for a link row.
 */
export function AttachmentLink({
  'aria-describedby': ariaDescribedBy,
  children,
  onClick,
  render,
  ...nativeProps
}: AttachmentLinkProps) {
  const { attachment, blocked, describedBy: description } = useTriggerWiring(ariaDescribedBy);

  const rootProps: AttachmentLinkRootProps = keyedProps({
    title: attachment.file.name,
    ...nativeProps,
    ...(description === undefined ? {} : { 'aria-describedby': description }),
    ...(blocked ? { 'aria-disabled': true } : {}),
    children: children ?? <AttachmentFilename />,
    'data-part': 'trigger',
    onClick: (event: MouseEvent<HTMLAnchorElement>) => {
      if (blocked) {
        event.preventDefault();
        return;
      }
      onClick?.(event);
    },
  });

  return render === undefined ? <a {...rootProps} /> : render(rootProps);
}

/**
 * The line under the name. Absent children, it writes the size with
 * `formatBytes` in the language in force; anything the page writes replaces
 * it — a date, a sender, `Uploading · 62%`.
 */
export function AttachmentDetail({ children, id, render, ...nativeProps }: AttachmentTextProps) {
  const attachment = useAttachment();
  const owned = useDescribes('detail', id);
  const size = attachment.file.size;

  const rootProps: AttachmentPartRootProps = keyedProps({
    ...nativeProps,
    id: owned,
    children: children ?? (size === undefined ? null : formatBytes(size, attachment.locale)),
    'data-part': 'detail',
  });

  return render === undefined ? <p {...rootProps} /> : render(rootProps);
}

/** Why the file failed, or anything longer than a line the page must say about it. */
export function AttachmentMessage({ id, render, ...nativeProps }: AttachmentTextProps) {
  const owned = useDescribes('message', id);

  const rootProps: AttachmentPartRootProps = keyedProps({
    ...nativeProps,
    id: owned,
    'data-part': 'message',
  });

  return render === undefined ? <p {...rootProps} /> : render(rootProps);
}

/**
 * The transfer, as the attachment's bottom edge: `progress-indicator`'s bar,
 * named by the file so a reader hears `claim-form.pdf, 62%`. Without a
 * `value` the bar is indeterminate — a scan, a conversion, a wait the page
 * cannot measure.
 */
export function AttachmentProgress({ render, value, ...nativeProps }: AttachmentProgressProps) {
  const attachment = useAttachment();

  const rootProps: AttachmentPartRootProps = keyedProps({
    ...nativeProps,
    children: (
      <ProgressBar
        hideLabel
        label={attachment.file.name}
        size="sm"
        tone={attachment.invalid ? 'danger' : 'accent'}
        value={value ?? null}
      />
    ),
    'data-part': 'progress',
  });

  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}

/**
 * The controls the application offers on the file, beside the trigger and
 * above its stretched target: interactive content may not nest inside `a`
 * or `button`.
 */
export function AttachmentActions({ render, ...nativeProps }: AttachmentPartProps) {
  const rootProps: AttachmentPartRootProps = keyedProps({ ...nativeProps, 'data-part': 'actions' });
  return render === undefined ? <div {...rootProps} /> : render(rootProps);
}

/**
 * One icon control of the application's own — download, share, reply with.
 * It is an inner control: no frame at rest, a state layer under the pointer.
 * It needs an `aria-label`, because it holds only a glyph. `render` puts it on
 * an `a` with `download`; an unavailable attachment disables it.
 */
export function AttachmentAction({
  render,
  type = 'button',
  ...nativeProps
}: AttachmentActionProps) {
  const attachment = useAttachment();

  const rootProps: AttachmentActionRootProps = keyedProps({
    ...nativeProps,
    'data-part': 'action',
    disabled: attachment.disabled || nativeProps.disabled === true,
    type,
  });

  return render === undefined ? <button {...rootProps} /> : render(rootProps);
}

/**
 * Asks to take the attachment out of its list. It renders only when the
 * attachment has `onRemove`, so a read-only thread never shows a control that
 * does nothing. Its name is the word and the file, `Remove claim-form.pdf`.
 */
export function AttachmentRemove({
  'aria-label': ariaLabel,
  children,
  onClick,
  render,
  type = 'button',
  ...nativeProps
}: AttachmentActionProps) {
  const attachment = useAttachment();
  if (!attachment.removable) return null;

  const rootProps: AttachmentActionRootProps = keyedProps({
    ...nativeProps,
    'aria-label': ariaLabel ?? attachment.t('remove', { name: attachment.file.name }),
    children: children ?? (
      <Icon>
        <Glyph name="x" />
      </Icon>
    ),
    'data-part': 'remove',
    disabled: attachment.disabled || nativeProps.disabled === true,
    onClick: (event: MouseEvent<HTMLElement>) => {
      onClick?.(event as MouseEvent<HTMLButtonElement>);
      if (event.defaultPrevented) return;
      attachment.request('remove', event);
    },
    type,
  });

  return render === undefined ? <button {...rootProps} /> : render(rootProps);
}
