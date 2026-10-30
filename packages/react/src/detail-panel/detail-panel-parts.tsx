import { keyedProps } from '@slotted/core/selector-key';
import { useCallback, useEffect, useRef } from 'react';

import { Badge } from '../badge';
import { Container } from '../container';
import { usePage } from '../page';
import {
  Section,
  SectionActions,
  SectionBody,
  SectionHeader,
  SectionHeading,
  SectionTags,
  SectionTitle,
} from '../section';
import type { SectionLevel } from '../section';
import { SkeletonText } from '../skeleton';
import { Tab, TabActions, TabList, Tabs, useTabs } from '../tabs';
import type { TabsChangeRequest } from '../tabs';
import { useDetailPanel } from './detail-panel';
import type {
  DetailPanelBodyProps,
  DetailPanelPartProps,
  DetailPanelSectionProps,
  DetailPanelSectionReason,
  DetailPanelSectionRootProps,
  DetailPanelTabsProps,
} from './detail-panel.types';

/** How many placeholder lines a waiting section and a waiting aside draw. */
const SECTION_SKELETON_LINES = 3;
const ASIDE_SKELETON_LINES = 4;

/**
 * The column under the header: a container at the page's width and inset,
 * so the columns align with the header's own; the banner above, the two
 * columns — the sections and the aside — and, when the record is not
 * there, the message in their place.
 */
export function DetailPanelBody({
  aside,
  banner,
  children,
  className,
  message,
  ref,
  render,
  style,
  ...nativeProps
}: DetailPanelBodyProps) {
  const panel = useDetailPanel();
  const page = usePage();
  const ready = panel.status === 'ready';
  const hasAside = panel.aside !== 'none' && (aside !== undefined || panel.loading);

  const rootProps: DetailPanelPartProps = keyedProps({
    ...nativeProps,
    children: (
      <Container inset={page?.inset} size={page?.width}>
        {banner !== undefined && banner !== null && banner !== false ? (
          <div data-part="banner" data-part-banner="">
            {banner}
          </div>
        ) : null}
        {ready ? (
          <div data-part="columns" data-part-columns="">
            <div data-part="main" data-part-main="">
              {children}
            </div>
            {hasAside ? (
              <aside data-part="aside" data-part-aside="" aria-label={panel.t('aside')}>
                {panel.loading ? (
                  <SkeletonText lines={ASIDE_SKELETON_LINES} inlineSize="60%" />
                ) : (
                  aside
                )}
              </aside>
            ) : null}
          </div>
        ) : (
          <div data-part="message" data-part-message="">
            {message}
          </div>
        )}
      </Container>
    ),
    className,
    'data-part': 'body',
    style,
  });

  if (render !== undefined) return render(rootProps);
  return <div {...rootProps} ref={ref} />;
}

/**
 * One named unit of content. Under `layout="tabs"` it is the tabpanel of
 * the strip's tab — hidden when not current, in the tab sequence, wired by
 * the ids the strip returns. Under `stacked` it holds a `Section` at the
 * rank below the panel's, with the label as heading and the count as a badge
 * in the section's tags: outside the heading, so it is not part of its name
 * and does not take its tracked capitals.
 *
 * While the panel is loading the content is not mounted; three skeleton
 * lines stand in its place.
 */
export function DetailPanelSection({
  actions,
  children,
  className,
  count,
  disabled,
  label,
  name,
  ref,
  render,
  style,
  ...nativeProps
}: DetailPanelSectionProps) {
  const panel = useDetailPanel();
  const element = useRef<HTMLElement | null>(null);

  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      element.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  const { register } = panel;
  useEffect(
    () => register({ name, label, count, disabled, element: element.current }),
    [register, name, label, count, disabled],
  );

  const current = panel.current === name;
  const tabbed = panel.layout === 'tabs';
  const identity = tabbed ? panel.identify?.(name) : undefined;
  const present = tabbed
    ? panel.mount === 'eager' || current || (panel.mount === 'lazy' && panel.seen(name))
    : true;

  const badge =
    count === undefined ? null : (
      <Badge count={count} shape="pill" size="sm" tone="secondary" variant="soft" />
    );
  const waiting = panel.loading ? <SkeletonText lines={SECTION_SKELETON_LINES} /> : null;

  const rootProps: DetailPanelSectionRootProps = keyedProps({
    ...nativeProps,
    ...(identity !== undefined ? { 'aria-labelledby': identity.tabId, id: identity.panelId } : {}),
    children: tabbed ? (
      <>
        {actions !== undefined && actions !== null && actions !== false ? (
          <div data-part="section-actions" data-part-section-actions="">
            {actions}
          </div>
        ) : null}
        {present ? (waiting ?? children) : null}
      </>
    ) : (
      <Section
        level={String(Math.min(Number(panel.level) + 1, 6)) as SectionLevel}
        size={panel.size}
      >
        <SectionHeader>
          <SectionTitle>
            <SectionHeading>{label}</SectionHeading>
            {badge === null ? null : <SectionTags>{badge}</SectionTags>}
          </SectionTitle>
          {actions !== undefined && actions !== null && actions !== false ? (
            <SectionActions>{actions}</SectionActions>
          ) : null}
        </SectionHeader>
        <SectionBody>{waiting ?? children}</SectionBody>
      </Section>
    ),
    className,
    ...(current ? { 'data-current': '' as const } : {}),
    'data-name': name,
    'data-part': 'section',
    ...(tabbed ? { hidden: !current, role: 'tabpanel', tabIndex: 0 } : {}),
    style,
  });

  if (render !== undefined) return render(rootProps);
  return <div {...rootProps} ref={setRef} />;
}

/** Hands the panel the strip's ids, so the sections can be wired to the tabs. */
function StripBridge() {
  const tabs = useTabs();
  const panel = useDetailPanel();
  const latest = useRef(tabs.identify);
  latest.current = tabs.identify;
  const { attachIdentify } = panel;
  useEffect(() => {
    attachIdentify((name) => latest.current(name));
    return () => attachIdentify(undefined);
  }, [attachIdentify]);
  return null;
}

/**
 * The strip: a `Tabs` list rendered from the registered sections, placed by
 * the consumer in the page-header's tabs slot. It holds the list alone; the
 * panels are the panel's own sections. Under `layout="stacked"` it renders
 * nothing, so a layout can be switched with one prop.
 */
export function DetailPanelTabs({ children, label }: DetailPanelTabsProps) {
  const panel = useDetailPanel();
  if (panel.layout !== 'tabs') return null;

  const onValueChange = (value: string, request: TabsChangeRequest) => {
    panel.select(value, request.reason as DetailPanelSectionReason, request.source);
  };

  return (
    <Tabs onValueChange={onValueChange} track="none" value={panel.current}>
      <StripBridge />
      <TabList aria-label={label}>
        {panel.sections.map((entry) => (
          <Tab disabled={entry.disabled} key={entry.name} value={entry.name}>
            {entry.label}
            {entry.count === undefined ? null : (
              <>
                {' '}
                <Badge count={entry.count} shape="pill" size="sm" tone="secondary" variant="soft" />
              </>
            )}
          </Tab>
        ))}
      </TabList>
      {children !== undefined && children !== null && children !== false ? (
        <TabActions>{children}</TabActions>
      ) : null}
    </Tabs>
  );
}
