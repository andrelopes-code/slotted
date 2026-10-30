import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { SlBadge } from '@slotted/angular/badge';
import { SlCard, SlCardBody, SlCardHeader } from '@slotted/angular/card';
import { SlCheckbox } from '@slotted/angular/checkbox';
import {
  SlListItem,
  SlListItemBody,
  SlListItemContent,
  SlListItemDescription,
  SlListItemEnd,
  SlListItemLabel,
  SlListItemStart,
} from '@slotted/angular/list-item';
import { SlSkeleton } from '@slotted/angular/skeleton';
import { SlHeading, SlText } from '@slotted/angular/typography';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlList } from './list';
import type { ListMarker, ListSize, ListVariant } from './list-defaults';
import { SlListEmpty, SlListSection, SlListSectionLabel, SlListSectionList } from './list-parts';
import { ANGULAR_LIST_DOCS, ANGULAR_LIST_TOKENS } from './list.docs';

interface ListStoryArgs {
  inset: boolean;
  loading: boolean;
  marker: ListMarker;
  size: ListSize;
  variant: ListVariant;
}

const IMPORTS = [
  SlBadge,
  SlCard,
  SlCardBody,
  SlCardHeader,
  SlCheckbox,
  SlHeading,
  SlList,
  SlListEmpty,
  SlListItem,
  SlListItemBody,
  SlListItemContent,
  SlListItemDescription,
  SlListItemEnd,
  SlListItemLabel,
  SlListItemStart,
  SlListSection,
  SlListSectionLabel,
  SlListSectionList,
  SlSkeleton,
  SlText,
];

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_LIST_DOCS.list.scenes, {
    playground: Playground,
    variant: Variant,
    marker: Marker,
    sections: Sections,
    inset: Inset,
    states: States,
    content: Content,
    composition: Composition,
    accessibility: Accessibility,
  }) as never;

const meta: Meta<ListStoryArgs> = {
  title: 'Components/List',
  component: SlList,
  decorators: [moduleMetadata({ imports: IMPORTS })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'List',
        description:
          'A vertical run of related rows, with groups, an empty message and a marker the family draws itself.',
        framework: 'Angular',
        ...ANGULAR_LIST_DOCS.list,
        tokens: ANGULAR_LIST_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<ListStoryArgs>;

const row = (label: string, meta = '') => `
      <li slListItem>
        <div slListItemContent>
          <span slListItemBody><span slListItemLabel>${label}</span></span>
          ${meta === '' ? '' : `<span slListItemEnd>${meta}</span>`}
        </div>
      </li>`;

export const Playground: Story = {
  args: { inset: false, loading: false, marker: 'none', size: 'md', variant: 'ruled' },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
<ul
  slList
  aria-label="Folders"
  [variant]="variant"
  [size]="size"
  [marker]="marker"
  [inset]="inset"
  [loading]="loading"
>
  <li slListItem>
    <a slListItemContent href="#photos">
      <span slListItemBody><span slListItemLabel>Photos</span></span>
      <span slListItemEnd>128</span>
    </a>
  </li>
  <li slListItem>
    <a slListItemContent href="#recordings">
      <span slListItemBody><span slListItemLabel>Recordings</span></span>
      <span slListItemEnd>12</span>
    </a>
  </li>
</ul>`,
  }),
};

export const Variant: Story = {
  parameters: scenario('variant'),
  render: () => ({
    template: `
<div class="slotted-demo-grid">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">plain</span>
      <span class="slotted-demo-scene__note">Nothing between the rows. The rhythm of the inset is what separates them, which is right for a short run inside a card.</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">
      <ul slList aria-label="Plain">${row('Photos')}${row('Recordings')}</ul>
    </div>
  </section>

  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">ruled</span>
      <span class="slotted-demo-scene__note">A hairline between rows, drawn by the row below — the only element that knows whether it is the first of its list.</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">
      <ul slList variant="ruled" aria-label="Ruled">${row('Photos')}${row('Recordings')}</ul>
    </div>
  </section>

  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">framed</span>
      <span class="slotted-demo-scene__note">The rules, plus a box around the set. The frame clips its own corners, so the first row hover fill does not square off a rounded edge.</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">
      <ul slList variant="framed" aria-label="Framed">${row('Photos')}${row('Recordings')}</ul>
    </div>
  </section>

  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">separated</span>
      <span class="slotted-demo-scene__note">A surface per row, and the one variant that spends a gap. A list of cards and a list of rows are the same family in two arrangements.</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">
      <ul slList variant="separated" aria-label="Separated">${row('Photos')}${row('Recordings')}</ul>
    </div>
  </section>
</div>`,
  }),
};

export const Marker: Story = {
  parameters: scenario('marker'),
  render: () => ({
    template: `
<div class="slotted-demo-grid">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">bullet, on a ul</span>
      <span class="slotted-demo-scene__note">Drawn geometry from the glyph scale, not a bullet character: it keeps its shape and its weight whatever typeface the reader has.</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">
      <ul slList marker="bullet" aria-label="Bulleted">
        ${row('A mark that survives a change of typeface')}
        ${row('A second line, so the mark can be seen sitting on the first rather than in the middle of the block')}
      </ul>
    </div>
  </section>

  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">number, on an ol</span>
      <span class="slotted-demo-scene__note">The element carries the reading order and the axis carries the mark, which is why an ordered set can paint its own badges and still read in order.</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">
      <ol slList marker="number" aria-label="Setup">
        ${row('Open the workspace')}${row('Choose a theme')}${row('Invite the rest of the team')}
      </ol>
    </div>
  </section>

  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">A count that restarts per group</span>
      <span class="slotted-demo-scene__note">Each group opens its own count rather than running through the set, which is what a numbered list of groups means.</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">
      <ol slList marker="number" variant="ruled" aria-label="Runs">
        <li slListSection>
          <h3 slListSectionLabel>First run</h3>
          <ol slListSectionList>${row('Import the archive')}${row('Check the report')}</ol>
        </li>
        <li slListSection>
          <h3 slListSectionLabel>Later</h3>
          <ol slListSectionList>${row('Import the archive')}</ol>
        </li>
      </ol>
    </div>
  </section>
</div>`,
  }),
};

export const Sections: Story = {
  parameters: scenario('sections'),
  render: () => ({
    template: `
<div class="slotted-demo-grid">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">A group, and the heading that names it</span>
      <span class="slotted-demo-scene__note">The nested list is named by the heading through aria-labelledby, so a reader who lands inside the group is told which group it is.</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">
      <ul slList variant="ruled" aria-label="Library">
        <li slListSection>
          <h3 slListSectionLabel>Folders</h3>
          <ul slListSectionList>${row('Photos', '128')}${row('Recordings', '12')}</ul>
        </li>
        <li slListSection>
          <h3 slListSectionLabel>Notes</h3>
          <ul slListSectionList>${row('Weekly review')}${row('Archive')}</ul>
        </li>
      </ul>
    </div>
  </section>

  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">sticky, over a set that scrolls</span>
      <span class="slotted-demo-scene__note">The heading takes the set surface and the library sticky stack level, so a row scrolling under it is covered rather than showing through. Scroll the stage to see it hold.</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">
      <div class="slotted-demo-scroll">
        <ul slList variant="ruled" aria-label="Scrolling library">
          <li slListSection>
            <h3 slListSectionLabel sticky>Folders</h3>
            <ul slListSectionList>
              ${row('Photos')}${row('Recordings')}${row('Exports')}${row('Invoices')}
            </ul>
          </li>
          <li slListSection>
            <h3 slListSectionLabel sticky>Notes</h3>
            <ul slListSectionList>
              ${row('Weekly review')}${row('Archive')}${row('Drafts')}${row('Templates')}
            </ul>
          </li>
        </ul>
      </div>
    </div>
  </section>

  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">A name that is not a heading</span>
      <span class="slotted-demo-scene__note">The directive goes on the element the page wrote, so a group whose name is not document structure is a span rather than a heading — and the nested list is still named by it.</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">
      <ul slList aria-label="Filters">
        <li slListSection>
          <span slListSectionLabel>Recently used</span>
          <ul slListSectionList>${row('Overdue')}${row('Unassigned')}</ul>
        </li>
      </ul>
    </div>
  </section>
</div>`,
  }),
};

export const Inset: Story = {
  parameters: scenario('inset'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">Default, inside a card</span>
      <span class="slotted-demo-scene__note">The rows carry their own inline padding, so every title sits two insets in from the card edge and the rule stops short of it on both sides.</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">
      <div slCard>
        <div slCardHeader><h3 slHeading [level]="3" size="md">Members</h3></div>
        <div slCardBody>
          <ul slList variant="ruled" aria-label="Members">${row('Ada Lovelace')}${row('Grace Hopper')}</ul>
        </div>
      </div>
    </div>
  </section>

  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">inset</span>
      <span class="slotted-demo-scene__note">The rows give the padding back, so the titles line up with the heading above them and the rule runs the full width of the card body — which is the half disableGutters leaves out elsewhere.</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">
      <div slCard>
        <div slCardHeader><h3 slHeading [level]="3" size="md">Members</h3></div>
        <div slCardBody>
          <ul slList inset variant="ruled" aria-label="Members">${row('Ada Lovelace')}${row('Grace Hopper')}</ul>
        </div>
      </div>
    </div>
  </section>
</div>`,
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">loading</span>
      <span class="slotted-demo-scene__note">aria-busy on the set, and nothing drawn: what stands in for the rows is slSkeleton, composed by the page. A second family drawing placeholder geometry would be two answers to one question.</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">
      <ul slList loading variant="ruled" aria-label="Folders">
        <li slListItem loading>
          <div slListItemContent>
            <span slListItemBody><span slSkeleton inlineSize="60%"></span></span>
            <span slListItemEnd><span slSkeleton inlineSize="2rem"></span></span>
          </div>
        </li>
        <li slListItem loading>
          <div slListItemContent>
            <span slListItemBody><span slSkeleton inlineSize="45%"></span></span>
            <span slListItemEnd><span slSkeleton inlineSize="2rem"></span></span>
          </div>
        </li>
      </ul>
    </div>
  </section>

  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">empty</span>
      <span class="slotted-demo-scene__note">The message is an li inside the set, so a reader hears it. Outside the list they would hear zero items and then silence, and the words would fall outside the frame.</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">
      <ul slList variant="framed" aria-label="Results">
        <li slListEmpty>
          <h3 slHeading [level]="3" size="md">No matches</h3>
          <span slText tone="muted">Clear the filter to see every folder again.</span>
        </li>
      </ul>
    </div>
  </section>
</div>`,
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    template: `
<div class="slotted-demo-grid">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">A page of a larger set</span>
      <span class="slotted-demo-scene__note">position and setSize belong to the row and are written only when the page knows them. Every row present makes them unnecessary, and ARIA 1.2 says so.</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">
      <ul slList variant="ruled" aria-label="Results 41 to 43 of 128">
        <li slListItem [position]="41" [setSize]="128">
          <div slListItemContent><span slListItemBody><span slListItemLabel>Result 41</span></span></div>
        </li>
        <li slListItem [position]="42" [setSize]="128">
          <div slListItemContent><span slListItemBody><span slListItemLabel>Result 42</span></span></div>
        </li>
        <li slListItem [position]="43" [setSize]="128">
          <div slListItemContent><span slListItemBody><span slListItemLabel>Result 43</span></span></div>
        </li>
      </ul>
    </div>
  </section>

  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">A set in another script</span>
      <span class="slotted-demo-scene__note">The marker column, the inset and the trailing metadata all mirror, because every rule is a logical property. Switch the toolbar to rtl to read it the other way.</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">
      <ul slList marker="bullet" aria-label="مجلدات">
        ${row('مساحة العمل المشتركة')}${row('التسجيلات')}
      </ul>
    </div>
  </section>
</div>`,
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    template: `
<div class="slotted-demo-grid">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">An inbox: slCheckbox, slBadge and a row that navigates</span>
      <span class="slotted-demo-scene__note">The set supplies the box and the rhythm. The chooser is slCheckbox and the count is slBadge, both composed — the family draws no check and no pill of its own.</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">
      <ul slList variant="ruled" aria-label="Inbox">
        <li slListItem selected>
          <div slListItemContent>
            <span slListItemStart>
              <span slCheckbox [checked]="true" aria-label="Select Quarterly report"></span>
            </span>
            <span slListItemBody>
              <span slListItemLabel>Quarterly report</span>
              <span slListItemDescription>Ada Lovelace · 14:02</span>
            </span>
            <span slListItemEnd><span slBadge tone="accent">3</span></span>
          </div>
        </li>
        <li slListItem>
          <div slListItemContent>
            <span slListItemStart>
              <span slCheckbox aria-label="Select Invoice 4417"></span>
            </span>
            <span slListItemBody>
              <span slListItemLabel>Invoice 4417</span>
              <span slListItemDescription>Northwind Traders · Yesterday</span>
            </span>
          </div>
        </li>
      </ul>
    </div>
  </section>

  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">A set that answers its own width</span>
      <span class="slotted-demo-scene__note">The set has no container of its own: the rows do. Below 22rem each row moves its metadata under the title, and the set is unchanged.</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">
      <div class="slotted-demo-measure">
        <ul slList variant="ruled" aria-label="Narrow">
          <li slListItem>
            <div slListItemContent>
              <span slListItemBody>
                <span slListItemLabel>Quarterly report, second revision</span>
                <span slListItemDescription>Ada Lovelace</span>
              </span>
              <span slListItemEnd>14:02</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </section>
</div>`,
  }),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => ({
    template: `
<div class="slotted-demo-grid">
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">A navigation list, in the landmark the page owns</span>
      <span class="slotted-demo-scene__note">The family writes no nav: a landmark is a decision about the page. The row says which one is current with aria-current, the one selection-shaped state ARIA 1.2 lets a listitem announce.</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">
      <nav aria-label="Sections">
        <ul slList>
          <li slListItem current="page">
            <a slListItemContent href="#billing">
              <span slListItemBody><span slListItemLabel>Billing</span></span>
            </a>
          </li>
          <li slListItem>
            <a slListItemContent href="#members">
              <span slListItemBody><span slListItemLabel>Members</span></span>
            </a>
          </li>
        </ul>
      </nav>
    </div>
  </section>

  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">A role the page wrote itself</span>
      <span class="slotted-demo-scene__note">The family writes role="list" because it drew its own marker, and reads a written role with HostAttributeToken before the binding runs. A page wiring a menu keeps what it wrote, and the keyboard that role needs is that page's to add.</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">
      <ul slList role="menu" variant="framed" aria-label="Row actions">
        ${row('Rename')}${row('Duplicate')}
      </ul>
    </div>
  </section>
</div>`,
  }),
};
