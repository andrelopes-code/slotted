import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import { SlBadge } from '@slotted/angular/badge';
import { SlButton } from '@slotted/angular/button';
import { SlCheckbox } from '@slotted/angular/checkbox';
import { SlList } from '@slotted/angular/list';
import { SlSkeleton } from '@slotted/angular/skeleton';
import { SlText } from '@slotted/angular/typography';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlListItem } from './list-item';
import type { ListItemAlign, ListItemSize, ListItemTone } from './list-item-defaults';
import { SlListItemContent } from './list-item-content';
import {
  SlListItemActions,
  SlListItemBody,
  SlListItemDescription,
  SlListItemEnd,
  SlListItemLabel,
  SlListItemStart,
} from './list-item-parts';
import { ANGULAR_LIST_ITEM_DOCS, ANGULAR_LIST_ITEM_TOKENS } from './list-item.docs';

interface ListItemStoryArgs {
  align: ListItemAlign;
  current: boolean;
  disabled: boolean;
  inset: boolean;
  loading: boolean;
  selected: boolean;
  size: ListItemSize;
  tone: ListItemTone;
  truncate: boolean;
}

const IMPORTS = [
  SlBadge,
  SlButton,
  SlCheckbox,
  SlList,
  SlListItem,
  SlListItemActions,
  SlListItemBody,
  SlListItemContent,
  SlListItemDescription,
  SlListItemEnd,
  SlListItemLabel,
  SlListItemStart,
  SlSkeleton,
  SlText,
];

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_LIST_ITEM_DOCS.listItem.scenes, {
    playground: Playground,
    'content-elements': ContentElements,
    anatomy: Anatomy,
    alignment: Alignment,
    tone: Tone,
    states: States,
    actions: Actions,
    reflow: Reflow,
    content: Content,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const meta: Meta<ListItemStoryArgs> = {
  title: 'Components/List Item',
  component: SlListItem,
  decorators: [moduleMetadata({ imports: IMPORTS })],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'List Item',
        description:
          'One row of a List: a leading visual, a title with its lines, trailing metadata, and independent targets beside the box rather than inside it.',
        framework: 'Angular',
        ...ANGULAR_LIST_ITEM_DOCS.listItem,
        tokens: ANGULAR_LIST_ITEM_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<ListItemStoryArgs>;

const scene = (label: string, note: string, body: string) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">${body}</div>
  </section>`;

const set = (label: string, rows: string) =>
  `<ul slList variant="ruled" aria-label="${label}">${rows}</ul>`;

const button = (label: string, attrs = '') => `
      <li slListItem ${attrs}>
        <button slListItemContent type="button">
          <span slListItemBody><span slListItemLabel>${label}</span></span>
        </button>
      </li>`;

export const Playground: Story = {
  args: {
    align: 'center',
    current: false,
    disabled: false,
    inset: false,
    loading: false,
    selected: false,
    size: 'md',
    tone: 'secondary',
    truncate: false,
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => ({
    props: args,
    template: `
<ul slList variant="ruled" aria-label="Folders">
  <li
    slListItem
    [align]="align"
    [tone]="tone"
    [size]="size"
    [inset]="inset"
    [truncate]="truncate"
    [selected]="selected"
    [current]="current"
    [disabled]="disabled"
    [loading]="loading"
  >
    <a slListItemContent href="#photos">
      <span slListItemBody>
        <span slListItemLabel>Photos</span>
        <span slListItemDescription>128 files · 2.4 GB</span>
      </span>
      <span slListItemEnd>Yesterday</span>
    </a>
    <span slListItemActions>
      <button slButton variant="ghost" size="sm" type="button">Remove</button>
    </span>
  </li>
</ul>`,
  }),
};

export const ContentElements: Story = {
  parameters: scenario('content-elements'),
  render: () => ({
    template: `
<div class="slotted-demo-grid">
${scene(
  'One directive, three accessibility trees',
  'The directive goes on the element the page wrote, so the router link, the form ownership and the modified click a browser gives an anchor all stay the page own. React exports three components instead, because there the component owns the tag.',
  set(
    'Content elements',
    `
      <li slListItem>
        <div slListItemContent>
          <span slListItemBody><span slListItemLabel>A row that is read</span></span>
          <span slListItemEnd><span slText size="xs" tone="muted">div</span></span>
        </div>
      </li>
      <li slListItem>
        <button slListItemContent type="button">
          <span slListItemBody><span slListItemLabel>A row that is one command</span></span>
          <span slListItemEnd><span slText size="xs" tone="muted">button</span></span>
        </button>
      </li>
      <li slListItem>
        <a slListItemContent href="#destination">
          <span slListItemBody><span slListItemLabel>A row that is one destination</span></span>
          <span slListItemEnd><span slText size="xs" tone="muted">a</span></span>
        </a>
      </li>`,
  ),
)}
</div>`,
  }),
};

export const Anatomy: Story = {
  parameters: scenario('anatomy'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
${scene(
  'Every part',
  'Leading visual, title, the lines under it, trailing metadata, and the independent target beside the box.',
  set(
    'Every part',
    `
      <li slListItem>
        <a slListItemContent href="#photos">
          <span slListItemStart><span slBadge tone="secondary">PH</span></span>
          <span slListItemBody>
            <span slListItemLabel>Photos</span>
            <span slListItemDescription>128 files · 2.4 GB</span>
          </span>
          <span slListItemEnd>Yesterday</span>
        </a>
        <span slListItemActions>
          <button slButton variant="ghost" size="sm" type="button">Remove</button>
        </span>
      </li>`,
  ),
)}
${scene(
  'A title alone',
  'Every part but the box is optional, and an absent one leaves no column behind: each gap is a margin on the part rather than a track on the grid.',
  set(
    'A title alone',
    `
      <li slListItem>
        <div slListItemContent>
          <span slListItemBody><span slListItemLabel>Photos</span></span>
        </div>
      </li>`,
  ),
)}
</div>`,
  }),
};

export const Alignment: Story = {
  parameters: scenario('alignment'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
${scene(
  'center',
  'Right while the block is one line, and wrong as soon as it is three: the mark floats in the middle of a paragraph it is meant to introduce.',
  set(
    'Centerd',
    `
      <li slListItem align="center">
        <div slListItemContent>
          <span slListItemStart><span slBadge tone="secondary">PH</span></span>
          <span slListItemBody>
            <span slListItemLabel>Photos</span>
            <span slListItemDescription>The description runs to a second and a third line, which is where the difference between the two values shows.</span>
          </span>
          <span slListItemEnd>14:02</span>
        </div>
      </li>`,
  ),
)}
${scene(
  'start',
  'The leading visual and the metadata return to the title own line, so a row of three lines reads from one corner. Angular Material derives this from counting the lines; a translated string can change that count.',
  set(
    'Aligned to the start',
    `
      <li slListItem align="start">
        <div slListItemContent>
          <span slListItemStart><span slBadge tone="secondary">PH</span></span>
          <span slListItemBody>
            <span slListItemLabel>Photos</span>
            <span slListItemDescription>The description runs to a second and a third line, which is where the difference between the two values shows.</span>
          </span>
          <span slListItemEnd>14:02</span>
        </div>
      </li>`,
  ),
)}
</div>`,
  }),
};

export const Tone: Story = {
  parameters: scenario('tone'),
  render: () => ({
    template: `
<div class="slotted-demo-grid">
${scene(
  'Five tones, on the rows that mean them',
  'A tone moves the ink, the wash under the pointer and the ground of a selected row, and never fills a resting row: forty rows each filled with a tone is a list nobody can read. Primer ships danger alone and hides the rest behind a boolean.',
  set(
    'Tones',
    `${button('Rename workspace', 'tone="secondary"')}${button('Invite a collaborator', 'tone="accent"')}${button('Publish the changes', 'tone="success"')}${button('Revoke every session', 'tone="warning"')}${button('Delete the workspace', 'tone="danger"')}`,
  ),
)}
</div>`,
  }),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => ({
    template: `
<div class="slotted-demo-grid">
${scene(
  'Every state the row paints',
  'Selection is the accent ground, the accent ink and a one-pixel edge together, because every tone surface is white in the high-contrast scheme. Current is the neutral ground with its own edge, so a row can be both at once and the selection is what shows. Hover the operable rows and Tab through them to see the rest.',
  set(
    'States',
    `${button('Default')}
      <li slListItem selected>
        <div slListItemContent>
          <span slListItemStart>
            <span slCheckbox [checked]="true" aria-label="Select Selected"></span>
          </span>
          <span slListItemBody>
            <span slListItemLabel>Selected — painted here, announced by slCheckbox</span>
          </span>
        </div>
      </li>
      <li slListItem current="page">
        <a slListItemContent href="#current">
          <span slListItemBody>
            <span slListItemLabel>Current — the one state a listitem may announce</span>
          </span>
        </a>
      </li>
      <li slListItem selected current="page">
        <a slListItemContent href="#both">
          <span slListItemBody>
            <span slListItemLabel>Selected and current, on two channels</span>
          </span>
        </a>
      </li>
      <li slListItem loading>
        <button slListItemContent type="button">
          <span slListItemBody>
            <span slListItemLabel>Loading — the command cannot run twice</span>
          </span>
          <span slListItemEnd><span slSkeleton inlineSize="3rem"></span></span>
        </button>
      </li>
      <li slListItem disabled>
        <button slListItemContent type="button">
          <span slListItemBody>
            <span slListItemLabel>Disabled</span>
            <span slListItemDescription>Unavailable while the index rebuilds</span>
          </span>
        </button>
      </li>`,
  ),
)}
</div>`,
  }),
};

export const Actions: Story = {
  parameters: scenario('actions'),
  render: () => ({
    template: `
<div class="slotted-demo-grid">
${scene(
  'A row that navigates and also deletes',
  'The two targets are siblings, so the row hit area stops before the button. Interactive content may not nest inside an anchor, and every surveyed implementation lets a consumer nest it anyway.',
  set(
    'Folders',
    `
      <li slListItem>
        <a slListItemContent href="#photos">
          <span slListItemBody>
            <span slListItemLabel>Photos</span>
            <span slListItemDescription>128 files</span>
          </span>
          <span slListItemEnd><span slBadge tone="accent">3</span></span>
        </a>
        <span slListItemActions>
          <button slButton variant="ghost" size="sm" type="button">Remove</button>
        </span>
      </li>`,
  ),
)}
${scene(
  'A disabled row, and a control that is not',
  'A disabled row refuses its own box and nothing else. The control beside it is the page own, and only the control can refuse its own interaction — the rule Card states for the same shape.',
  set(
    'Folders',
    `
      <li slListItem disabled>
        <a slListItemContent href="#exports">
          <span slListItemBody>
            <span slListItemLabel>Exports</span>
            <span slListItemDescription>Unavailable while the index rebuilds</span>
          </span>
        </a>
        <span slListItemActions>
          <button slButton variant="ghost" size="sm" type="button">Remove</button>
        </span>
      </li>`,
  ),
)}
</div>`,
  }),
};

export const Reflow: Story = {
  parameters: scenario('reflow'),
  render: () => ({
    template: `
<div class="slotted-demo-grid" data-columns="2">
${scene(
  'Wide enough for one line',
  'The metadata sits at the end of the row, in the column the title gives way to.',
  set(
    'Wide',
    `
      <li slListItem>
        <a slListItemContent href="#report">
          <span slListItemBody>
            <span slListItemLabel>Quarterly report, second revision</span>
            <span slListItemDescription>Ada Lovelace</span>
          </span>
          <span slListItemEnd>14:02</span>
        </a>
      </li>`,
  ),
)}
${scene(
  'Below 22rem',
  'The row answers its own inline size, not the viewport: the metadata leaves the inline axis and sits under the title, and the independent targets take a line of their own. The leading visual stays — it is the row own identity, and moving it says nothing.',
  `<div class="slotted-demo-measure">${set(
    'Narrow',
    `
      <li slListItem>
        <a slListItemContent href="#report">
          <span slListItemBody>
            <span slListItemLabel>Quarterly report, second revision</span>
            <span slListItemDescription>Ada Lovelace</span>
          </span>
          <span slListItemEnd>14:02</span>
        </a>
      </li>`,
  )}</div>`,
)}
</div>`,
  }),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => ({
    template: `
<div class="slotted-demo-grid">
${scene(
  'Content the family did not choose',
  'An unbroken token breaks inside the row instead of pushing the metadata out; a translated title gives way and the timestamp does not; a title in another script keeps its own direction and leaves the row around it alone.',
  set(
    'Content',
    `
      <li slListItem align="start">
        <a slListItemContent href="#unbroken">
          <span slListItemBody>
            <span slListItemLabel>https://example.test/workspaces/9f2c1ab4e77d4c5f9a3b6e8d0c1f2a34/settings</span>
            <span slListItemDescription>One unbroken token</span>
          </span>
          <span slListItemEnd>Yesterday</span>
        </a>
      </li>
      <li slListItem align="start">
        <a slListItemContent href="#translated">
          <span slListItemBody>
            <span slListItemLabel>Notification settings for external workspace collaborators</span>
            <span slListItemDescription>A translated string is longer</span>
          </span>
          <span slListItemEnd>14:02</span>
        </a>
      </li>
      <li slListItem>
        <a slListItemContent href="#arabic">
          <span slListItemBody>
            <span slListItemLabel>مساحة العمل المشتركة</span>
            <span slListItemDescription>Another script, its own direction</span>
          </span>
          <span slListItemEnd>14:02</span>
        </a>
      </li>`,
  ),
)}
${scene(
  'truncate',
  'The title is clipped to one line and the lines under it are clipped with it — a clipped title over four wrapped lines is a row that gave up on one measure and not the other. The whole string stays in the document.',
  set(
    'Truncated',
    `
      <li slListItem truncate>
        <a slListItemContent href="#truncate">
          <span slListItemBody>
            <span slListItemLabel>A title the row cannot grow for, clipped rather than wrapped, with every word of it still readable to assistive technology.</span>
            <span slListItemDescription>The description is clipped with it, because two measures in one row read as a mistake.</span>
          </span>
          <span slListItemEnd>14:02</span>
        </a>
      </li>`,
  ),
)}
</div>`,
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => ({
    template: `
<div class="slotted-demo-grid">
${scene(
  'An inbox, built from the families beside it',
  'slCheckbox announces the selection the row paints, slBadge carries the count, slButton is the independent target. The rows are aligned to the start, so the chooser shares a line with the subject rather than floating between it and the sender.',
  set(
    'Inbox',
    `
      <li slListItem align="start" selected>
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
        <span slListItemActions>
          <button slButton variant="ghost" size="sm" type="button">Remove</button>
        </span>
      </li>
      <li slListItem align="start">
        <div slListItemContent>
          <span slListItemStart>
            <span slCheckbox aria-label="Select Invoice 4417"></span>
          </span>
          <span slListItemBody>
            <span slListItemLabel>Invoice 4417</span>
            <span slListItemDescription>Northwind Traders · Yesterday</span>
          </span>
          <span slListItemEnd><span slBadge tone="secondary">1</span></span>
        </div>
        <span slListItemActions>
          <button slButton variant="ghost" size="sm" type="button">Remove</button>
        </span>
      </li>`,
  ),
)}
${scene(
  'One decision for every row under it',
  'provideListItemDefaults sets a danger tone and a start alignment for a whole injector. The second row states both itself, so its ink is neutral and its leading visual sits on the middle of the block — which is the difference two lines of text are what make visible.',
  set(
    'Provided',
    `
      <li slListItem>
        <div slListItemContent>
          <span slListItemStart><span slBadge tone="secondary">PH</span></span>
          <span slListItemBody>
            <span slListItemLabel>Reads the provider</span>
            <span slListItemDescription>Danger ink, and the mark on the title own line — where the provider put it.</span>
          </span>
        </div>
      </li>
      <li slListItem align="center" tone="secondary">
        <div slListItemContent>
          <span slListItemStart><span slBadge tone="secondary">PH</span></span>
          <span slListItemBody>
            <span slListItemLabel>States its own tone and alignment</span>
            <span slListItemDescription>Neutral ink, and the mark centerd on the block — because an explicit value always wins.</span>
          </span>
        </div>
      </li>`,
  ),
)}
</div>`,
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    template: `
<div class="slotted-demo-grid">
${scene(
  'Tab through the row, and past it',
  'The family binds no key. Tab reaches the box and then the control beside it; Enter follows a link, Enter and Space activate a button. A disabled button leaves the sequence, while a disabled link stays in it and refuses the activation — which is what keeps its description reachable.',
  set(
    'Keyboard',
    `
      <li slListItem>
        <a slListItemContent href="#first">
          <span slListItemBody>
            <span slListItemLabel>A destination, then its own control</span>
          </span>
        </a>
        <span slListItemActions>
          <button slButton variant="ghost" size="sm" type="button">Remove</button>
        </span>
      </li>
      ${button('A command, on Enter and on Space')}
      <li slListItem disabled>
        <a slListItemContent href="#disabled">
          <span slListItemBody>
            <span slListItemLabel>A disabled destination, still reachable</span>
            <span slListItemDescription>Unavailable while the index rebuilds</span>
          </span>
        </a>
      </li>
      ${button('A disabled command, out of the sequence', 'disabled')}`,
  ),
)}
</div>`,
  }),
};
