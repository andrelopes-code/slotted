import { keyedProps } from '@slotted/core/selector-key';
import {
  carouselKeyIntent,
  indicatorDistance,
  intentPage,
  revealInStrip,
} from '@slotted/core/carousel';
import { createRovingTabindex } from '@slotted/core/focus';
import type { RovingTabindexHandle } from '@slotted/core/focus';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent, ReactNode, Ref } from 'react';

import { Glyph, Icon } from '../icon';
import { useCarousel } from './carousel';
import type {
  CarouselButtonProps,
  CarouselButtonRootProps,
  CarouselControlsProps,
  CarouselCounterProps,
  CarouselIndicatorProps,
  CarouselIndicatorRootProps,
  CarouselIndicatorsProps,
  CarouselPageReason,
  CarouselSlideProps,
  CarouselViewportProps,
} from './carousel.types';

/**
 * A click synthesised by the keyboard reports no detail; a real one reports
 * the click count. It is the rule every activating family in this library
 * writes.
 */
function activationReason(
  event: MouseEvent<HTMLElement>,
): CarouselPageReason & ('pointer' | 'keyboard') {
  return event.detail === 0 ? 'keyboard' : 'pointer';
}

/** A ref the family needs and a ref the consumer passed, both called. */
function useMergedRef<T>(own: (node: T | null) => void, theirs: Ref<T> | undefined) {
  return useCallback(
    (node: T | null) => {
      own(node);
      if (typeof theirs === 'function') return theirs(node);
      if (theirs) (theirs as { current: T | null }).current = node;
      return undefined;
    },
    [own, theirs],
  );
}

/**
 * The scroller, and the one element the family moves.
 *
 * It takes focus of its own, so a carousel with no controls can still be
 * paged from the keyboard: the arrows of its axis move a page and mirror in a
 * right-to-left document, `PageUp` and `PageDown` move a page, and `Home` and
 * `End` reach the ends. A held key does not animate.
 */
export function CarouselViewport({
  children,
  onKeyDown,
  ref,
  render,
  ...nativeProps
}: CarouselViewportProps) {
  const carousel = useCarousel();
  const attach = useMergedRef<HTMLDivElement>(carousel.attachViewport, ref);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.target !== event.currentTarget) return;
    const direction = getComputedStyle(event.currentTarget).direction === 'rtl' ? 'rtl' : 'ltr';
    const intent = carouselKeyIntent(event.key, carousel.orientation, direction);
    if (intent === null) return;
    const target = intentPage(intent, carousel.page, carousel.pageCount, carousel.loop);
    if (target === -1) return;
    event.preventDefault();
    carousel.go(target, 'keyboard', event, { instant: event.repeat });
  }

  const rootProps = keyedProps({
    'aria-label': carousel.t('viewport'),
    role: 'group',
    tabIndex: 0,
    ...nativeProps,
    children,
    'data-part': 'viewport',
    id: carousel.viewportId,
    onKeyDown: handleKeyDown,
  });

  return render === undefined ? (
    <div {...rootProps} ref={attach} />
  ) : (
    render({ ...rootProps, ref: attach } as never)
  );
}

/**
 * One slide. The engine names it "3 de 8" unless it carries a name of its
 * own, marks it when it is in view, and makes it `inert` when it is not, so a
 * screen reader and the `Tab` key reach only what the reader can see.
 */
export function CarouselSlide({ children, ref, render, ...nativeProps }: CarouselSlideProps) {
  const carousel = useCarousel();
  const rootProps = keyedProps({
    role: 'group',
    'aria-roledescription': carousel.t('slideRoleDescription'),
    ...nativeProps,
    children,
    'data-part': 'slide',
  });
  return render === undefined ? (
    <div {...rootProps} ref={ref} />
  ) : (
    render({ ...rootProps, ref } as never)
  );
}

function StepButton({
  children,
  delta,
  onClick,
  ref,
  render,
  ...nativeProps
}: CarouselButtonProps & { delta: 1 | -1 }) {
  const carousel = useCarousel();
  const available = delta === 1 ? carousel.canNext : carousel.canPrevious;

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);
    if (event.defaultPrevented || !available) return;
    carousel.step(delta, activationReason(event), event);
  }

  const rootProps: CarouselButtonRootProps = keyedProps({
    'aria-controls': carousel.viewportId,
    'aria-label': carousel.t(delta === 1 ? 'next' : 'previous'),
    ...nativeProps,
    /* aria-disabled, never disabled: a disabled button drops the focus it holds onto the page. */
    ...(available ? {} : { 'aria-disabled': 'true' as const, 'data-disabled': '' as const }),
    children: children ?? (
      <Icon directional={carousel.orientation === 'horizontal'}>
        <Glyph name="chevron-right" />
      </Icon>
    ),
    'data-part': delta === 1 ? 'next' : 'previous',
    onClick: handleClick,
    type: 'button',
  });

  return render === undefined ? (
    <button {...rootProps} ref={ref} />
  ) : (
    render({ ...rootProps, ref } as never)
  );
}

/** The control that shows the previous page. At the first page without a loop it stays, and says so. */
export function CarouselPrevious(props: CarouselButtonProps) {
  return <StepButton {...props} delta={-1} />;
}

/** The control that shows the next page. */
export function CarouselNext(props: CarouselButtonProps) {
  return <StepButton {...props} delta={1} />;
}

/**
 * The rotation control. Its name is the action it will perform — "Stop
 * rotation" while it runs, "Resume rotation" while it does not — and it
 * carries no pressed state, as the APG asks. It renders nothing in a carousel
 * that does not rotate.
 */
export function CarouselAutoplay({
  children,
  onClick,
  ref,
  render,
  ...nativeProps
}: CarouselButtonProps) {
  const carousel = useCarousel();
  if (!carousel.autoplay) return null;

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;
    carousel.setPlaying(!carousel.playing, activationReason(event), event);
  }

  const rootProps: CarouselButtonRootProps = keyedProps({
    'aria-controls': carousel.viewportId,
    'aria-label': carousel.t(carousel.playing ? 'stop' : 'start'),
    ...nativeProps,
    children: children ?? (
      <Icon>
        <Glyph name={carousel.playing ? 'pause' : 'play'} />
      </Icon>
    ),
    'data-part': 'autoplay',
    onClick: handleClick,
    type: 'button',
  });

  return render === undefined ? (
    <button {...rootProps} ref={ref} />
  ) : (
    render({ ...rootProps, ref } as never)
  );
}

/** The bar the controls stand in: under the viewport, or over its foot. */
export function CarouselControls({
  children,
  placement = 'below',
  ref,
  render,
  ...nativeProps
}: CarouselControlsProps) {
  const rootProps = keyedProps({
    ...nativeProps,
    children,
    'data-part': 'controls',
    'data-placement': placement,
  });
  return render === undefined ? (
    <div {...rootProps} ref={ref} />
  ) : (
    render({ ...rootProps, ref } as never)
  );
}

/**
 * The slide picker, as the APG's tabs: one tab stop, the arrows move and show
 * the page they land on, and they stop at the ends. Without children the
 * family draws a dot — or a segment — per page; a function child draws each
 * indicator, which is how a thumbnail strip is written.
 */
export function CarouselIndicators({
  children,
  ref,
  render,
  variant = 'dots',
  ...nativeProps
}: CarouselIndicatorsProps) {
  const carousel = useCarousel();
  const [list, setList] = useState<HTMLDivElement | null>(null);
  const roving = useRef<RovingTabindexHandle | null>(null);
  const latest = useRef(carousel);
  latest.current = carousel;
  const attach = useMergedRef<HTMLDivElement>(setList, ref);

  useEffect(() => {
    if (list === null) return undefined;
    const handle = createRovingTabindex(list, {
      itemSelector: '[data-part="indicator"]',
      loop: false,
      orientation: () => 'horizontal',
      onMove: (index) => latest.current.go(index, 'keyboard', undefined),
    });
    roving.current = handle;
    return () => {
      handle.destroy();
      roving.current = null;
    };
  }, [list]);

  useEffect(() => {
    roving.current?.refresh();
    roving.current?.setActive(carousel.page);
    if (variant !== 'thumbnails' || list === null) return;
    const item = list.querySelectorAll<HTMLElement>('[data-part="indicator"]')[carousel.page];
    if (item !== undefined) revealInStrip(list, item);
  }, [carousel.page, carousel.pageCount, list, variant]);

  const adaptive = variant === 'dots' && indicatorDistance(0, 0, carousel.pageCount) !== null;
  const pagesList = Array.from({ length: carousel.pageCount }, (_, index) => index);

  const rootProps = keyedProps({
    'aria-label': carousel.t('indicators'),
    ...nativeProps,
    children: pagesList.map((index) =>
      children === undefined ? <CarouselIndicator key={index} page={index} /> : children(index),
    ) as ReactNode,
    'data-part': 'indicators',
    'data-variant': variant,
    ...(adaptive ? { 'data-adaptive': '' } : {}),
    role: 'tablist' as const,
  });

  return render === undefined ? (
    <div {...rootProps} ref={attach} />
  ) : (
    render({ ...rootProps, ref: attach } as never)
  );
}

/** One page in the picker. Its content is the family's mark, or what the consumer puts in it. */
export function CarouselIndicator({
  children,
  onClick,
  page,
  ref,
  render,
  ...nativeProps
}: CarouselIndicatorProps) {
  const carousel = useCarousel();
  const current = carousel.page === page;
  const distance = indicatorDistance(page, carousel.page, carousel.pageCount);
  const first = carousel.pages.starts[page];
  const controls = first === undefined ? undefined : carousel.slideIds[first];

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;
    carousel.go(page, activationReason(event), event);
  }

  const rootProps: CarouselIndicatorRootProps = keyedProps({
    ...(children === undefined
      ? {
          'aria-label': carousel.t('indicator', { page: page + 1, count: carousel.pageCount }),
        }
      : {}),
    ...nativeProps,
    'aria-controls': controls,
    'aria-selected': current,
    children,
    ...(current ? { 'data-current': '' as const } : {}),
    ...(distance === null ? {} : { 'data-distance': distance }),
    'data-part': 'indicator',
    onClick: handleClick,
    role: 'tab',
    tabIndex: current ? 0 : -1,
    type: 'button',
  });

  return render === undefined ? (
    <button {...rootProps} ref={ref} />
  ) : (
    render({ ...rootProps, ref } as never)
  );
}

/**
 * "3 / 8", hidden from assistive technology: the slides' names and the
 * announcement already say where the reader is, and a second voice saying it
 * again is noise.
 */
export function CarouselCounter({ children, ref, render, ...nativeProps }: CarouselCounterProps) {
  const carousel = useCarousel();
  const shown = carousel.pageCount === 0 ? 0 : carousel.page + 1;
  const number = new Intl.NumberFormat(carousel.locale);
  const rootProps = keyedProps({
    'aria-hidden': true,
    ...nativeProps,
    children:
      children === undefined
        ? `${number.format(shown)} / ${number.format(carousel.pageCount)}`
        : children(shown, carousel.pageCount),
    'data-part': 'counter',
  });
  return render === undefined ? (
    <span {...rootProps} ref={ref} />
  ) : (
    render({ ...rootProps, ref } as never)
  );
}
