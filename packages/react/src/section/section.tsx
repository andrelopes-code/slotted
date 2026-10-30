import { keyedProps } from '@slotted/core/selector-key';
import { observeStuck } from '@slotted/core/sticky-header';
import '@slotted/styles/section/section.css';

import { createContext, useContext, useEffect, useId, useState } from 'react';

import { useHeadingLevel } from '../typography';
import type { HeadingLevelValue } from '../typography';
import { useSectionDefaults } from './section-defaults';
import type { SectionContextValue, SectionProps, SectionRootProps } from './section.types';

const SectionContext = createContext<SectionContextValue | undefined>(undefined);

/**
 * What the section around this part says. A part outside one has no rank to
 * take, so this throws rather than rendering a heading at a guess.
 */
export function useSection(): SectionContextValue {
  const context = useContext(SectionContext);
  if (context === undefined) {
    throw new Error('A Section part must be rendered inside Section.');
  }
  return context;
}

/**
 * One unit of content inside a page: a header — eyebrow, heading,
 * description, actions — and a body one outline step deeper.
 *
 * **The rank is the outline's.** `typography` owns it: the heading takes the
 * rank `HeadingLevel` gives, `h2` directly in a page and one deeper inside
 * another section, unless `level` says otherwise. The body is wrapped one
 * step deeper, so a nested section takes the next rank.
 *
 * **A region only when it has a name.** The root is `aria-labelledby` its
 * heading once one is rendered, which makes the `section` a region landmark;
 * without a heading it is a plain `section`, as the APG says of an unnamed
 * one.
 *
 * **The hooks anchor navigation needs.** The root carries an `id`, from
 * `useId` or the consumer's own, and a scroll margin the height of the page's
 * fixed chrome, so a hash link lands under the header rather than behind it.
 */
/** The measured height of a sticky section's header, written on the root. */
export const HEADER_SIZE_PROPERTY = '--slotted-section-header-size';

export function Section({
  children,
  className,
  divider,
  ground,
  id,
  level,
  ref,
  render,
  size,
  sticky,
  style,
  ...nativeProps
}: SectionProps) {
  const defaults = useSectionDefaults();
  const ambient = useHeadingLevel();
  const generatedId = useId();
  const [hasHeading, setHasHeading] = useState(false);
  const [header, setHeader] = useState<HTMLElement | null>(null);

  const resolvedDivider = divider ?? defaults.divider;
  const resolvedGround = ground ?? defaults.ground;
  const resolvedSize = size ?? defaults.size;
  const resolvedSticky = sticky ?? defaults.sticky;
  const resolvedLevel: HeadingLevelValue =
    level === undefined || level === 'auto' ? ambient : (Number(level) as HeadingLevelValue);
  const rootId = id ?? `${generatedId}section`;

  const context: SectionContextValue = {
    headingId: `${rootId}-heading`,
    level: resolvedLevel,
    registerHeading: setHasHeading,
    registerHeader: setHeader,
  };

  /**
   * A sticky header is chrome for what is under it: its height, measured,
   * goes on the root as `--slotted-section-header-size`, and the stylesheet
   * republishes `--slotted-page-sticky-top` for the body as page plus header,
   * so a table's column header or a nested section stops under this header.
   * Written on the element rather than rendered, so a resize costs no render.
   */
  useEffect(() => {
    const root = header?.parentElement;
    if (!resolvedSticky || !header || !root) return undefined;
    /* Rounded up: a fractional height rounded down leaves a hairline gap the rows show through. */
    const write = () =>
      root.style.setProperty(
        HEADER_SIZE_PROPERTY,
        `${Math.ceil(header.getBoundingClientRect().height || header.offsetHeight)}px`,
      );
    write();
    if (typeof ResizeObserver === 'undefined') {
      return () => root.style.removeProperty(HEADER_SIZE_PROPERTY);
    }
    const sizes = new ResizeObserver(write);
    sizes.observe(header);
    return () => {
      sizes.disconnect();
      root.style.removeProperty(HEADER_SIZE_PROPERTY);
    };
  }, [header, resolvedSticky]);

  /**
   * `data-stuck` on the header while content passes under it, so a theme
   * can paint the header's ground only then. Written on the element, as the
   * size is, so a scroll costs no render.
   */
  useEffect(() => {
    if (!resolvedSticky || !header) return undefined;
    const stop = observeStuck(header, (stuck) => {
      if (stuck) header.setAttribute('data-stuck', '');
      else header.removeAttribute('data-stuck');
    });
    return () => {
      stop();
      header.removeAttribute('data-stuck');
    };
  }, [header, resolvedSticky]);

  const rootProps: SectionRootProps = keyedProps({
    ...nativeProps,
    ...(hasHeading ? { 'aria-labelledby': context.headingId } : {}),
    children,
    className,
    ...(resolvedDivider ? { 'data-divider': '' } : {}),
    'data-ground': resolvedGround,
    'data-level': String(resolvedLevel),
    'data-part': 'root',
    'data-size': resolvedSize,
    ...(resolvedSticky ? { 'data-sticky': '' } : {}),
    'data-ui': 'section',
    id: rootId,
    style,
  });

  return (
    <SectionContext.Provider value={context}>
      {render === undefined ? <section {...rootProps} ref={ref} /> : render(rootProps)}
    </SectionContext.Provider>
  );
}
