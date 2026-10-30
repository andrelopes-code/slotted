import { keyedProps } from '@slotted/core/selector-key';
import { useCallback, useEffect } from 'react';
import type { KeyboardEvent, MouseEvent, ReactNode, Ref } from 'react';

import { Button } from '../button';
import { Glyph, Icon } from '../icon';
import { useTourContext } from './tour';
import type {
  TourActionProps,
  TourBodyProps,
  TourCloseProps,
  TourContentProps,
  TourContentRootProps,
  TourDescriptionProps,
  TourFooterProps,
  TourHeaderProps,
  TourMediaProps,
  TourProgressProps,
  TourTitleProps,
} from './tour.types';

/**
 * The family's own handler runs after the consumer's, and only if the consumer
 * has not called `preventDefault`.
 */
function compose<E extends { defaultPrevented: boolean }>(
  theirs: ((event: E) => void) | undefined,
  ours: (event: E) => void,
) {
  return (event: E) => {
    theirs?.(event);
    if (!event.defaultPrevented) ours(event);
  };
}

function attach<T>(node: T, ...refs: (Ref<T> | undefined)[]) {
  for (const ref of refs) {
    if (typeof ref === 'function') ref(node);
    else if (ref !== null && ref !== undefined) ref.current = node;
  }
}

/**
 * The card. `role="dialog"`, named by the title part and described by the
 * description part when each is present. `aria-modal` is written only on a
 * modal step, the only state in which the page behind is actually inert.
 *
 * The arrow keys are read here: with focus in the card and outside a text
 * field, `ArrowRight` goes on and `ArrowLeft` goes back, mirrored right to
 * left.
 */
export function TourContent({ children, ref, render, ...nativeProps }: TourContentProps) {
  const tour = useTourContext();

  const setNode = useCallback(
    (node: HTMLElement | null) => {
      tour.setContentNode(node);
      attach(node, ref as Ref<HTMLElement> | undefined);
    },
    [ref, tour.setContentNode],
  );

  const rootProps: TourContentRootProps = keyedProps({
    ...nativeProps,
    children,
    ...(tour.hasTitle ? { 'aria-labelledby': tour.titleId } : {}),
    ...(tour.hasDescription ? { 'aria-describedby': tour.descriptionId } : {}),
    ...(tour.modal ? { 'aria-modal': true as const } : {}),
    'data-part': 'content',
    onKeyDown: compose(nativeProps.onKeyDown, (event: KeyboardEvent<HTMLElement>) =>
      tour.onKeyDown(event.nativeEvent),
    ),
    role: nativeProps.role ?? 'dialog',
    tabIndex: -1,
  });

  if (render !== undefined) return render({ ...rootProps, ref: setNode });
  return <div {...rootProps} ref={setNode} />;
}

/** The picture that opens a step: the step's `media`, or the part's own children. */
export function TourMedia({ children, ref, render, ...nativeProps }: TourMediaProps) {
  const tour = useTourContext();
  const content: ReactNode = children ?? tour.step.media;
  if (content === undefined || content === null) return null;

  const rootProps = keyedProps({ ...nativeProps, children: content, 'data-part': 'media' });
  if (render !== undefined)
    return render({ ...rootProps, ref: (node) => attach(node, ref as Ref<HTMLElement>) });
  return <div {...rootProps} ref={ref} />;
}

/** Where the reader is, and the way out, on one row. */
export function TourHeader({ children, ref, render, ...nativeProps }: TourHeaderProps) {
  const rootProps = keyedProps({ ...nativeProps, children, 'data-part': 'header' });
  if (render !== undefined)
    return render({ ...rootProps, ref: (node) => attach(node, ref as Ref<HTMLElement>) });
  return <div {...rootProps} ref={ref} />;
}

/**
 * "2 of 5", counting only the steps whose condition holds now. A tour of one
 * step — a single coach mark — has nothing to count and shows nothing.
 */
export function TourProgress({ children, ref, render, ...nativeProps }: TourProgressProps) {
  const tour = useTourContext();
  if (children === undefined && tour.total <= 1) return null;

  const rootProps = keyedProps({
    ...nativeProps,
    children: children ?? tour.t('progress', { position: tour.position, total: tour.total }),
    'data-part': 'progress',
  });
  if (render !== undefined)
    return render({ ...rootProps, ref: (node) => attach(node, ref as Ref<HTMLElement>) });
  return <p {...rootProps} ref={ref} />;
}

/**
 * Closes the tour with the outcome `close`, which a product reads as "the
 * reader may want this later". The reason is `dismiss`, as for every close
 * control in the library.
 */
export function TourClose({ children, onClick, ref, render, ...nativeProps }: TourCloseProps) {
  const tour = useTourContext();
  if (tour.step.actions?.close === false) return null;

  const rootProps = keyedProps({
    'aria-label': tour.t('close'),
    ...nativeProps,
    /* The cross is the library's own glyph, unless the consumer wrote content of their own. */
    children: children ?? (
      <Icon size="sm">
        <Glyph name="x" />
      </Icon>
    ),
    'data-part': 'close',
    onClick: compose(onClick, (event: MouseEvent<HTMLButtonElement>) =>
      tour.close('close', { detail: event.detail, dismiss: true }),
    ),
    type: 'button' as const,
  });
  if (render !== undefined)
    return render({ ...rootProps, ref: (node) => attach(node, ref as Ref<HTMLElement>) });
  return <button {...rootProps} ref={ref} />;
}

/**
 * The card's accessible name: the step's `title`, or the part's own children.
 * An `h2`, because a tour card is a dialog and a dialog's title is its
 * heading; `render` produces another level where the page needs one.
 */
export function TourTitle({ children, ref, render, ...nativeProps }: TourTitleProps) {
  const tour = useTourContext();
  const content: ReactNode = children ?? tour.step.title;
  const present = content !== undefined && content !== null && content !== false;

  useEffect(() => {
    tour.setHasTitle(present);
    return () => tour.setHasTitle(false);
  }, [present, tour.setHasTitle]);

  const setNode = useCallback(
    (node: HTMLElement | null) => {
      tour.setTitleNode(node);
      attach(node, ref as Ref<HTMLElement> | undefined);
    },
    [ref, tour.setTitleNode],
  );

  if (!present) return null;
  const rootProps = keyedProps({
    ...nativeProps,
    children: content,
    'data-part': 'title',
    id: tour.titleId,
  });
  if (render !== undefined) return render({ ...rootProps, ref: setNode });
  return <h2 {...rootProps} ref={setNode} />;
}

export function TourDescription({ children, ref, render, ...nativeProps }: TourDescriptionProps) {
  const tour = useTourContext();
  const content: ReactNode = children ?? tour.step.description;
  const present = content !== undefined && content !== null && content !== false;

  useEffect(() => {
    tour.setHasDescription(present);
    return () => tour.setHasDescription(false);
  }, [present, tour.setHasDescription]);

  if (!present) return null;
  const rootProps = keyedProps({
    ...nativeProps,
    children: content,
    'data-part': 'description',
    id: tour.descriptionId,
  });
  if (render !== undefined)
    return render({ ...rootProps, ref: (node) => attach(node, ref as Ref<HTMLElement>) });
  return <p {...rootProps} ref={ref} />;
}

/** The step's own `content`, and the only part of the card that scrolls. */
export function TourBody({ children, ref, render, ...nativeProps }: TourBodyProps) {
  const tour = useTourContext();
  const content: ReactNode = children ?? tour.step.content;
  if (content === undefined || content === null || content === false) return null;

  const rootProps = keyedProps({ ...nativeProps, children: content, 'data-part': 'body' });
  if (render !== undefined)
    return render({ ...rootProps, ref: (node) => attach(node, ref as Ref<HTMLElement>) });
  return <div {...rootProps} ref={ref} />;
}

/** The actions. A consumer's own button placed here sits beside the family's. */
export function TourFooter({ children, ref, render, ...nativeProps }: TourFooterProps) {
  const rootProps = keyedProps({ ...nativeProps, children, 'data-part': 'footer' });
  if (render !== undefined)
    return render({ ...rootProps, ref: (node) => attach(node, ref as Ref<HTMLElement>) });
  return <div {...rootProps} ref={ref} />;
}

type ActionPart = 'skip' | 'prev' | 'next';

function action(
  part: ActionPart,
  label: string,
  props: TourActionProps,
  onPress: (event: MouseEvent<HTMLButtonElement>) => void,
  appearance: { tone: 'accent' | 'secondary'; variant: 'solid' | 'outline' | 'ghost' },
  extra: { loading?: boolean; loadingMessage?: string; last?: boolean } = {},
) {
  const { children, onClick, render, ...nativeProps } = props;
  return (
    <Button
      {...nativeProps}
      {...(extra.loading === undefined ? {} : { loading: extra.loading })}
      {...(extra.loadingMessage === undefined
        ? {}
        : { messages: { loading: extra.loadingMessage } })}
      onClick={compose(onClick, onPress)}
      render={({ ref: buttonRef, ...buttonProps }) => {
        const partProps = keyedProps({
          ...buttonProps,
          'data-part': part,
          ...(extra.last ? { 'data-last': '' } : {}),
          ref: (node: HTMLElement | null) => attach(node, buttonRef as Ref<HTMLElement>),
        });
        return render === undefined ? <button {...partProps} /> : render(partProps);
      }}
      size="sm"
      tone={appearance.tone}
      variant={appearance.variant}
    >
      {children ?? label}
    </Button>
  );
}

/**
 * Leaves the tour with the outcome `skip`, which a product reads as "do not
 * offer this again". Absent on the last step, where Done says the same, and
 * in a tour of one step.
 */
export function TourSkip(props: TourActionProps) {
  const tour = useTourContext();
  const shown = tour.step.actions?.skip ?? (!tour.last && tour.total > 1);
  if (!shown) return null;
  return action(
    'skip',
    tour.t('skip'),
    props,
    (event) => tour.close('skip', { detail: event.detail }),
    { tone: 'secondary', variant: 'ghost' },
  );
}

/** Back to the previous available step. Absent on the first. */
export function TourPrev(props: TourActionProps) {
  const tour = useTourContext();
  const shown = tour.step.actions?.prev ?? !tour.first;
  if (!shown) return null;
  return action('prev', tour.t('prev'), props, (event) => tour.prev({ detail: event.detail }), {
    tone: 'secondary',
    variant: 'outline',
  });
}

/**
 * On to the next available step, or Done on the last, which closes with the
 * outcome `complete`. While the next step prepares it carries `button`'s own
 * loading state, and a second press is refused by the button. A step that
 * advances on the reader's own action at the target shows no Next unless it
 * asks for one.
 */
export function TourNext(props: TourActionProps) {
  const tour = useTourContext();
  const shown = tour.step.actions?.next ?? tour.step.advanceOn === undefined;
  if (!shown) return null;
  return action(
    'next',
    tour.t(tour.last ? 'done' : 'next'),
    props,
    (event) => tour.next({ detail: event.detail }),
    { tone: 'accent', variant: 'solid' },
    { last: tour.last, loading: tour.pending, loadingMessage: tour.t('preparing') },
  );
}
