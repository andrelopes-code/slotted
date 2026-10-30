import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { Button } from '../button';
import { Grid, Scene } from '../field/field-demo';
import { SlottedProvider } from '../i18n';
import { Inline } from '../inline';
import { Link } from '../link';
import { Stack } from '../stack';
import { ScrollArea } from './scroll-area';
import {
  Line,
  Log,
  Notes,
  Paths,
  RegionList,
  Regions,
  RELEASES,
  TRANSLATED,
} from './scroll-area-demo';
import { REACT_SCROLL_AREA_DOCS, REACT_SCROLL_AREA_TOKENS } from './scroll-area.docs';
import type { ScrollAreaHandle, ScrollAreaProps, ScrollPosition } from './scroll-area.types';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_SCROLL_AREA_DOCS.scrollArea.scenes, {
    playground: Playground,
    axis: Axis,
    scrollbars: Scrollbars,
    fade: Fade,
    gutter: Gutter,
    overscroll: Overscroll,
    maximum: Maximum,
    keyboard: Keyboard,
    content: Content,
    composition: Composition,
    print: Print,
    accessibility: Accessibility,
  }) as never;

const meta = {
  title: 'Components/ScrollArea',
  component: ScrollArea,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Scroll Area',
        description:
          'A scrollport and the box that frames it. The scrollbar is the platform’s, themed through scrollbar-color; the keyboard is the platform’s too. What the family adds is the measurement of whether the content overflows — published on the frame in logical names and painted as a veil that needs no ink — and the tab stop and name a scrolling region owes, written only while there is something to scroll.',
        framework: 'React',
        ...REACT_SCROLL_AREA_DOCS.scrollArea,
        tokens: REACT_SCROLL_AREA_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A bounded, framed area. The bound and the frame are workbench primitives
 * because a story may not paint inline, and the frame is on the root — the
 * element the veil is not on — which is the anatomy decision the page shows.
 */
function Framed({
  children,
  scrollTo,
  ...props
}: Omit<ScrollAreaProps, 'ref'> & { scrollTo?: Partial<ScrollPosition> }) {
  const handle = useRef<ScrollAreaHandle>(null);

  /* A scene that shows the veil at both ends has to start in the middle. */
  useEffect(() => {
    if (scrollTo !== undefined) handle.current?.scrollTo(scrollTo);
  }, [scrollTo]);

  return (
    <ScrollArea className="slotted-demo-bound slotted-demo-frame" ref={handle} {...props}>
      <ScrollArea.Content>{children}</ScrollArea.Content>
    </ScrollArea>
  );
}

export const Playground: Story = {
  parameters: scenario('playground'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Release notes · block · auto · both"
        note="The default configuration: one axis, the platform bar, the veil at both ends. Scroll to the end and the bottom veil lifts; go back to the start and the top one disappears."
      >
        <Framed messages={{ label: 'Release notes' }}>
          <Notes />
        </Framed>
      </Scene>
    </Grid>
  ),
};

export const Axis: Story = {
  parameters: scenario('axis'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="block — the default axis"
        note="Only the block axis scrolls. The inline axis is pinned, so a long line wraps instead of running off to the side."
      >
        <Framed messages={{ label: 'Release notes' }}>
          <Notes />
        </Framed>
      </Scene>
      <Scene
        label="inline — a row that overflows the box"
        note="The veil falls on the end the reader has not reached yet, and mirrors with the document: in RTL it sits on the left. The horizontal bar is the platform's."
      >
        <ScrollArea axis="inline" className="slotted-demo-frame" messages={{ label: 'Regions' }}>
          <ScrollArea.Content>
            <Regions />
          </ScrollArea.Content>
        </ScrollArea>
      </Scene>
      <Scene
        label="both — a log wider and taller than the box"
        note="Four veils, and the two masks multiply at the corners. The square between the two bars is drawn by the system."
      >
        <Framed axis="both" messages={{ label: 'Export log' }} scrollTo={{ block: 40, inline: 60 }}>
          <Log />
        </Framed>
      </Scene>
    </Grid>
  ),
};

export const Scrollbars: Story = {
  parameters: scenario('scrollbars'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="auto"
        note="The bar appears when there is something to scroll and reserves its space from the start, so nothing moves when it appears."
      >
        <Framed messages={{ label: 'Release notes' }}>
          <Notes />
        </Framed>
      </Scene>
      <Scene
        label="always"
        note="The gutter stays reserved and drawn even on content that fits entirely. It is overflow: scroll, the platform's way of saying the same."
      >
        <Framed messages={{ label: 'Release notes' }} scrollbars="always">
          <Notes releases={RELEASES.slice(0, 2)} />
        </Framed>
      </Scene>
      <Scene
        label="hover"
        note="The gutter stays, the bar is not painted until a pointer or the keyboard is inside. It is the CSS half of what Radix and Mantine spend a timer on."
      >
        <Framed messages={{ label: 'Release notes' }} scrollbars="hover">
          <Notes />
        </Framed>
      </Scene>
      <Scene
        label="none"
        note="No bar and no gutter. The content still scrolls by wheel, touch, keyboard and scrollTo, and the veil becomes the only thing saying there is more."
      >
        <Framed messages={{ label: 'Release notes' }} scrollbars="none">
          <Notes />
        </Framed>
      </Scene>
    </Grid>
  ),
};

export const Fade: Story = {
  parameters: scenario('fade'),
  render: () => (
    <Grid columns={3}>
      <Scene
        label="both"
        note="Darkens what the reader has already passed and what is still ahead. The two ends read as one idea."
      >
        <Framed messages={{ label: 'Regions' }} scrollTo={{ block: 40 }}>
          <RegionList />
        </Framed>
      </Scene>
      <Scene
        label="end"
        note="Only the end toward which there is more content. The start of the list stays crisp, for those who prefer not to darken what has already been read."
      >
        <Framed fade="end" messages={{ label: 'Regions' }} scrollTo={{ block: 40 }}>
          <RegionList />
        </Framed>
      </Scene>
      <Scene
        label="none"
        note="No veil and no mask: the bar is left alone to say there is more, and the area does not pay for a compositing layer."
      >
        <Framed fade="none" messages={{ label: 'Regions' }} scrollTo={{ block: 40 }}>
          <RegionList />
        </Framed>
      </Scene>
    </Grid>
  ),
};

/** Three short lines: content that fits, so the gutter is the only thing that varies. */
function Fits() {
  return (
    <Stack gap={1}>
      <Line weight="semibold">2026.9.2 — Billing</Line>
      <Line tone="muted">Three lines that fit entirely.</Line>
      <Line tone="muted">Nothing to scroll.</Line>
    </Stack>
  );
}

/**
 * The inset painted, so the room the gutter holds back is visible as the strip
 * the paint does not reach. The ground is a workbench surface rather than a
 * color the story states.
 */
function Painted(props: Omit<ScrollAreaProps, 'ref' | 'children'>) {
  return (
    <ScrollArea className="slotted-demo-bound slotted-demo-frame" {...props}>
      <ScrollArea.Content className="slotted-demo-surface" data-surface="sunken">
        <Fits />
      </ScrollArea.Content>
    </ScrollArea>
  );
}

export const Gutter: Story = {
  parameters: scenario('gutter'),
  render: () => (
    <Grid columns={3}>
      <Scene
        label="auto"
        note="The inset reaches the frame. The moment the content grows past the box, the bar appears and pushes the text to the left."
      >
        <Painted gutter="auto" messages={{ label: 'Release notes' }} />
      </Scene>
      <Scene
        label="stable — default"
        note="A bar width is reserved on the right from the start, so nothing moves when it appears."
      >
        <Painted messages={{ label: 'Release notes' }} />
      </Scene>
      <Scene
        label="both-edges"
        note="The same width on both sides, so a centered column stays centered whether the bar is there or not."
      >
        <Painted gutter="both-edges" messages={{ label: 'Release notes' }} />
      </Scene>
    </Grid>
  ),
};

/**
 * A page that scrolls, with an area inside it. The page is the workbench's
 * scrolling stage, inset by a surface so the area does not sit against the
 * stage's own edge, with enough lines either side of the area that scrolling
 * the page is visibly a different movement from scrolling the area.
 */
function Page({ children }: { children: ReactNode }) {
  return (
    <div className="slotted-demo-scroll">
      <div className="slotted-demo-surface">
        <Stack gap={4}>
          <Line tone="muted">This page scrolls. Scroll it until you reach the area.</Line>
          <Line tone="muted">Then scroll the area to the end, and keep going.</Line>
          {children}
          <Line tone="muted">This line is below the area, on the page.</Line>
          <Line tone="muted">And this one too.</Line>
          <Line tone="muted">And this is the last line of the page.</Line>
        </Stack>
      </div>
    </div>
  );
}

export const Overscroll: Story = {
  parameters: scenario('overscroll'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="contain — default"
        note="Reach the end of the area and keep scrolling: the page behind stays still. A bounded region whose last inch moves the page is the defect the property came to solve."
      >
        <Page>
          <ScrollArea
            className="slotted-demo-frame"
            messages={{ label: 'Release notes' }}
            maxBlockSize="7rem"
          >
            <ScrollArea.Content>
              <Notes releases={RELEASES.slice(0, 2)} />
            </ScrollArea.Content>
          </ScrollArea>
        </Page>
      </Scene>
      <Scene
        label="auto"
        note="The same gesture chains to the page, which is what the browser does by default. A consumer who wants that says so."
      >
        <Page>
          <ScrollArea
            className="slotted-demo-frame"
            messages={{ label: 'Release notes' }}
            maxBlockSize="7rem"
            overscroll="auto"
          >
            <ScrollArea.Content>
              <Notes releases={RELEASES.slice(0, 2)} />
            </ScrollArea.Content>
          </ScrollArea>
        </Page>
      </Scene>
    </Grid>
  ),
};

function Growing() {
  const [count, setCount] = useState(2);

  return (
    <Stack gap={4}>
      <ScrollArea
        className="slotted-demo-frame"
        messages={{ label: 'Release notes' }}
        maxBlockSize="12rem"
      >
        <ScrollArea.Content>
          <Notes releases={RELEASES.slice(0, count)} />
        </ScrollArea.Content>
      </ScrollArea>
      <Inline gap={3}>
        <Button
          disabled={count >= RELEASES.length}
          onClick={() => setCount((value) => Math.min(value + 1, RELEASES.length))}
          size="sm"
          variant="outline"
        >
          Add a note
        </Button>
        <Button
          disabled={count <= 1}
          onClick={() => setCount((value) => Math.max(value - 1, 1))}
          size="sm"
          variant="outline"
        >
          Tirar uma
        </Button>
      </Inline>
    </Stack>
  );
}

export const Maximum: Story = {
  parameters: scenario('maximum'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="maxBlockSize — 12rem"
        note="With two notes the area has the height of the two and does not scroll. Add notes: it grows to twelve rem and starts scrolling, and the named region with a tab stop appears at the same moment the overflow appears."
      >
        <Growing />
      </Scene>
    </Grid>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Tab reaches the region; the rest belongs to the platform"
        note="Press Tab to the area and then the arrows, PageDown, End and Home. The family writes none of these keys — it writes only the tab stop that makes them reachable."
      >
        <Framed messages={{ label: 'Release notes' }}>
          <Notes />
        </Framed>
      </Scene>
      <Scene
        label="tabbable={false} — a child already takes focus"
        note="The link inside is already a tab stop, and a second one on the scroll port would be one that does nothing. Tab goes straight to the link; the pointer can still focus the area."
      >
        <Framed messages={{ label: 'Release notes' }} tabbable={false}>
          <Stack gap={4}>
            <Line tone="muted">
              The full note is in <Link href="#release-notes">release notes 2026.9</Link>, which
              opens on the same page.
            </Line>
            <Notes releases={RELEASES.slice(1)} />
          </Stack>
        </Framed>
      </Scene>
    </Grid>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Grid columns={3}>
      <Scene
        label="Three unbroken paths"
        note="A token that does not break scrolls on the inline axis and is veiled where it leaves the box. The horizontal bar appears below all three."
      >
        <Framed axis="both" messages={{ label: 'Exported files' }}>
          <Paths />
        </Framed>
      </Scene>
      <Scene
        label="A translation twice as long"
        note="Wraps and scrolls on the block axis, like any text. The veil falls on the word that is leaving, not on an inset."
      >
        <Framed messages={{ label: 'Änderungsprotokoll' }}>
          <Line tone="muted">{TRANSLATED}</Line>
        </Framed>
      </Scene>
      <Scene
        label="Three lines that fit"
        note="Nothing overflows, so the area is a box like any other: no veil, no bar, no tab stop and no role."
      >
        <Framed messages={{ label: 'Release notes' }}>
          <Fits />
        </Framed>
      </Scene>
    </Grid>
  ),
};

function Driven() {
  const area = useRef<ScrollAreaHandle>(null);
  const last = useRef<HTMLParagraphElement>(null);
  const [block, setBlock] = useState(0);

  return (
    <Stack gap={4}>
      <ScrollArea
        className="slotted-demo-bound slotted-demo-frame"
        messages={{ label: 'Release notes' }}
        onScrollChange={(position) => setBlock(Math.round(position.block))}
        ref={area}
        render={(props) => <section {...props} />}
      >
        <ScrollArea.Content>
          <Stack gap={4}>
            <Notes releases={RELEASES.slice(0, 4)} />
            <Line id="last-note" weight="semibold">
              <span ref={last}>2026.8.8 — Collections, the last line</span>
            </Line>
          </Stack>
        </ScrollArea.Content>
      </ScrollArea>
      <Inline gap={3}>
        <Button onClick={() => area.current?.scrollToEdge('block-end')} size="sm" variant="outline">
          Fim
        </Button>
        <Button
          onClick={() => area.current?.scrollToEdge('block-start')}
          size="sm"
          variant="outline"
        >
          Start
        </Button>
        <Button
          onClick={() => last.current !== null && area.current?.reveal(last.current)}
          size="sm"
          variant="outline"
        >
          Reveal the last line
        </Button>
        <Line tone="muted">{block} px from the start</Line>
      </Inline>
    </Stack>
  );
}

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="ref, onScrollChange and render"
        note="The buttons move the area through the handle and nothing around it moves — reveal moves the container alone, unlike scrollIntoView. The position is reported on every scroll, and the frame is a section."
      >
        <Driven />
      </Scene>
    </Grid>
  ),
};

export const Print: Story = {
  parameters: scenario('print'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="On paper, everything"
        note="Open the print preview of this page: the area drops its maximum size and the @media print clipping and prints all six notes, not the two that were in view. None of the five implementations surveyed does this."
      >
        <Framed messages={{ label: 'Release notes' }}>
          <Notes />
        </Framed>
      </Scene>
    </Grid>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
      <Grid columns={3}>
        <Scene
          label="Overflows — a named region"
          // language: pt-BR
          note="role=region, tabindex=0 and the name from the pt-BR catalog: «Conteúdo rolável». A screen reader announces the name on entry and uses the browser's own arrows."
          // language: en-US
        >
          <Framed>
            <RegionList />
          </Framed>
        </Scene>
        <Scene
          label="Fits — nothing"
          note="No role, no name, no tab stop. A tab stop on content that fits is one that does nothing, and a page with eight areas would have eight."
        >
          <Framed>
            <Fits />
          </Framed>
        </Scene>
        <Scene
          label="Named by the heading — labelledBy"
          note="The heading above is the name of the region, in the order the name resolves: labelledBy, then messages.label, then the catalog."
        >
          <Stack gap={3}>
            <Line id="notes-heading" weight="semibold">
              Regions
            </Line>
            <Framed labelledBy="notes-heading">
              <RegionList />
            </Framed>
          </Stack>
        </Scene>
      </Grid>
    </SlottedProvider>
  ),
};
