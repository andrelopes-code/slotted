import { keyedProps } from '@slotted/core/selector-key';
import { createContext, useContext, useEffect } from 'react';

import { HeadingLevel } from '../typography';
import { useSection } from './section';
import type {
  SectionDescriptionProps,
  SectionEyebrowProps,
  SectionHeadingProps,
  SectionHeadingRootProps,
  SectionPartComponentProps,
  SectionPartProps,
} from './section.types';

const isDevelopment = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV === true;

/** Whether a part is written inside `SectionTitle`, where the stylesheet looks for the description. */
const TitleContext = createContext(false);

function part(name: string, displayName: string) {
  function Part({
    children,
    className,
    ref,
    render,
    style,
    ...nativeProps
  }: SectionPartComponentProps) {
    const rootProps: SectionPartProps = keyedProps({
      ...nativeProps,
      children,
      className,
      'data-part': name,
      style,
    });
    if (render !== undefined) return render(rootProps);
    return <div {...rootProps} ref={ref} />;
  }
  Part.displayName = displayName;
  return Part;
}

/**
 * The row above the body: the title column and the actions. It hands the
 * root its element, so a sticky header's height reaches the stylesheet.
 */
export function SectionHeader({
  children,
  className,
  ref,
  render,
  style,
  ...nativeProps
}: SectionPartComponentProps) {
  const { registerHeader } = useSection();
  const setRef = (node: HTMLElement | null) => {
    registerHeader(node);
    const own = node as HTMLDivElement | null;
    if (typeof ref === 'function') ref(own);
    else if (ref) ref.current = own;
  };
  const rootProps: SectionPartProps = keyedProps({
    ...nativeProps,
    children,
    className,
    'data-part': 'header',
    style,
  });
  if (render !== undefined) return render({ ...rootProps, ref: setRef });
  return <div {...rootProps} ref={setRef} />;
}
const TitlePart = part('title', 'SectionTitle');

/** Eyebrow, heading, tags, description, in that order. */
export function SectionTitle(props: SectionPartComponentProps) {
  return (
    <TitleContext.Provider value>
      <TitlePart {...props} />
    </TitleContext.Provider>
  );
}
/**
 * Badges or tags beside the heading — a count, a status — on its baseline.
 * Outside the heading, so they are not read into the region's name.
 */
export const SectionTags = part('tags', 'SectionTags');
/** The end of the header row: a Button, a Toolbar, a Link. */
export const SectionActions = part('actions', 'SectionActions');

/** A short overline above the heading — a count, a category. Structural, not status. */
export function SectionEyebrow({
  children,
  className,
  ref,
  render,
  style,
  ...nativeProps
}: SectionEyebrowProps) {
  const rootProps: SectionPartProps = keyedProps({
    ...nativeProps,
    children,
    className,
    'data-part': 'eyebrow',
    style,
  });
  if (render !== undefined) return render(rootProps);
  return <span {...rootProps} ref={ref} />;
}

/**
 * The heading, at the rank the section resolved. Rendering it is what makes
 * the section a region: the root names it through `aria-labelledby`.
 */
export function SectionHeading({
  children,
  className,
  ref,
  render,
  style,
  ...nativeProps
}: SectionHeadingProps) {
  const { headingId, level, registerHeading } = useSection();

  useEffect(() => {
    registerHeading(true);
    return () => registerHeading(false);
  }, [registerHeading]);

  const rootProps: SectionHeadingRootProps = keyedProps({
    ...nativeProps,
    children,
    className,
    'data-part': 'heading',
    id: headingId,
    style,
  });
  if (render !== undefined) {
    return render({ ...rootProps, role: 'heading', 'aria-level': level });
  }
  const Heading = `h${level}` as 'h2';
  return <Heading {...rootProps} ref={ref} />;
}

/** A paragraph under the heading, in the muted text, with a measure. */
export function SectionDescription({
  children,
  className,
  ref,
  render,
  style,
  ...nativeProps
}: SectionDescriptionProps) {
  const inTitle = useContext(TitleContext);
  if (isDevelopment && !inTitle) {
    console.warn(
      'SectionDescription is written outside SectionTitle, so the stylesheet does not reach it and it renders unstyled. Move it inside SectionTitle.',
    );
  }
  const rootProps: SectionPartProps = keyedProps({
    ...nativeProps,
    children,
    className,
    'data-part': 'description',
    style,
  });
  if (render !== undefined) return render(rootProps);
  return <p {...rootProps} ref={ref} />;
}

/** The content, one outline step deeper. */
export function SectionBody({
  children,
  className,
  ref,
  render,
  style,
  ...nativeProps
}: SectionPartComponentProps) {
  const rootProps: SectionPartProps = keyedProps({
    ...nativeProps,
    children: <HeadingLevel>{children}</HeadingLevel>,
    className,
    'data-part': 'body',
    style,
  });
  if (render !== undefined) return render(rootProps);
  return <div {...rootProps} ref={ref} />;
}
