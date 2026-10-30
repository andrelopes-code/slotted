import { bindScenes, createReferencePage, isolated, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { applicationConfig, moduleMetadata } from '@storybook/angular-vite';

import { SlButton } from '@slotted/angular/button';
import {
  SlTooltip,
  SlTooltipArrow,
  SlTooltipContent,
  SlTooltipLayer,
  SlTooltipTrigger,
} from '@slotted/angular/tooltip';

import { SlPopover } from './popover';
import { providePopoverDefaults } from './popover-defaults';
import {
  SlPopoverAnchor,
  SlPopoverArrow,
  SlPopoverBody,
  SlPopoverClose,
  SlPopoverContent,
  SlPopoverDescription,
  SlPopoverFooter,
  SlPopoverHeader,
  SlPopoverLayer,
  SlPopoverTitle,
  SlPopoverTrigger,
} from './popover-parts';
import { ANGULAR_POPOVER_DOCS, ANGULAR_POPOVER_TOKENS } from './popover.docs';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_POPOVER_DOCS.popover.scenes, {
    playground: Playground,
    sizes: Sizes,
    width: Width,
    placement: Placement,
    anchor: Anchor,
    focus: Focus,
    dismissal: Dismissal,
    scrolling: Scrolling,
    composition: Composition,
    nested: Nested,
    keyboard: Keyboard,
  });

const scene = (label: string, note: string, body: string) => `
  <section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="stack">${body}</div>
  </section>`;

const grid = (columns: 1 | 2 | 3, scenes: string) =>
  `<div class="slotted-demo-grid" data-columns="${String(columns)}">${scenes}</div>`;

/**
 * The ground every demonstration opens inside. A popover is portalled to the end
 * of the document by default, which is right in an application and wrong on a
 * page of stacked scenes. `contain: paint` on this box makes it the containing
 * block for the layer and clips it to the scene, and every demonstration but
 * `composition` pairs it with `[portal]="false"`.
 */
const viewport = (body: string) =>
  `<div class="slotted-demo-viewport" data-place="top" data-size="tall"><div class="slotted-demo-row">${body}</div></div>`;

const rows = (label: string, value: string) =>
  `<div class="slotted-demo-rows"><span>${label}</span><span>${value}</span></div>`;

const panel = (attributes: string, label: string, title: string, body: string, footer = '') => `
  <ng-container slPopover [portal]="false" ${attributes}>
    <button slButton tone="secondary" variant="outline" slPopoverTrigger type="button">${label}</button>
    <ng-template slPopoverLayer>
      <div slPopoverContent${title === '' ? ` aria-label="${label}"` : ''}>
        ${
          title === ''
            ? ''
            : `<div slPopoverHeader>
                 <div slPopoverTitle>${title}</div>
                 <button slPopoverClose></button>
               </div>`
        }
        <div slPopoverBody>${body}</div>
        ${footer === '' ? '' : `<div slPopoverFooter>${footer}</div>`}
      </div>
      <div slPopoverArrow></div>
    </ng-template>
  </ng-container>`;

const meta: Meta<SlPopover> = {
  title: 'Components/Popover',
  component: SlPopover,
  decorators: [
    moduleMetadata({
      imports: [
        SlButton,
        SlPopover,
        SlPopoverAnchor,
        SlPopoverArrow,
        SlPopoverBody,
        SlPopoverClose,
        SlPopoverContent,
        SlPopoverDescription,
        SlPopoverFooter,
        SlPopoverHeader,
        SlPopoverLayer,
        SlPopoverTitle,
        SlPopoverTrigger,
        SlTooltip,
        SlTooltipArrow,
        SlTooltipContent,
        SlTooltipLayer,
        SlTooltipTrigger,
      ],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        ...ANGULAR_POPOVER_DOCS.popover,
        description:
          'Interactive, non-modal content anchored to the control that opened it. Nothing behind it becomes inert, the page keeps scrolling and focus is not contained — the modal surface is slDialog.',
        framework: 'Angular',
        scenes: referenceScenes,
        title: 'Popover',
        tokens: ANGULAR_POPOVER_TOKENS,
      }),
    },
  },
};

export default meta;
type Story = StoryObj<SlPopover>;

export const Playground: Story = {
  parameters: scenario('playground'),
  render: (_args, context) => ({
    props: { pictured: isolated(context) },
    template: grid(
      1,
      scene(
        'Press, and the panel takes the focus',
        'It focuses the panel itself rather than its first control, so a reader hears the panel name before its contents. Escape closes it and the focus goes back to the button.',
        viewport(
          panel(
            'side="bottom" [open]="pictured"',
            'Filters',
            'Filter invoices',
            'Unpaid, overdue and disputed invoices issued in the last quarter.',
            '<button slButton size="sm" tone="secondary" variant="ghost" type="button">Reset</button><button slButton size="sm" type="button">Apply</button>',
          ),
        ),
      ),
    ),
  }),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: (_args, context) => ({
    props: { pictured: isolated(context) },
    template: grid(
      1,
      scene(
        'Sixteen, twenty and twenty-four rems',
        'The inset and the title step move with the width. The panel own inset is on the space scale, as slCard and slAlert are, and density moves what it holds.',
        viewport(
          panel(
            'side="bottom" size="sm" [open]="pictured"',
            'Small',
            'Small',
            'The tighter inset and the medium type step.',
          ) +
            panel(
              'side="bottom" size="md" [open]="pictured"',
              'Medium',
              'Medium',
              'The step every popover starts at.',
            ) +
            panel(
              'side="bottom" size="lg" [open]="pictured"',
              'Large',
              'Large',
              'For a panel that holds a form rather than a sentence.',
            ),
        ),
      ),
    ),
  }),
};

export const Width: Story = {
  parameters: scenario('width'),
  render: (_args, context) => ({
    props: { pictured: isolated(context) },
    template: grid(
      2,
      scene(
        'As wide as its own words',
        'auto sizes the panel to its content and stops at the measure its size step gives it. Past that the text wraps rather than setting one line the width of the page.',
        viewport(
          panel(
            'side="bottom" align="start" width="auto" [open]="pictured"',
            'Automatic',
            '',
            'Sized by what is written in it.',
          ),
        ),
      ) +
        scene(
          'As wide as the control it hangs from',
          'anchor reads the anchor measured width, which is the one case Radix publishes a custom property for and never uses. It is what a filter panel under a search field needs.',
          viewport(
            panel(
              'side="bottom" align="start" width="anchor" [open]="pictured"',
              'An unusually wide trigger',
              '',
              'Exactly as wide as the button above.',
            ),
          ),
        ),
    ),
  }),
};

export const Placement: Story = {
  parameters: scenario('placement'),
  render: () => ({
    template: grid(
      2,
      scene(
        'The four physical sides',
        'Each button asks for one edge. Narrow the window until one collides and it flips to the opposite side, then slides along it rather than leaving the screen.',
        viewport(
          panel('side="top"', 'top', '', 'Above the button.') +
            panel('side="bottom"', 'bottom', '', 'Below the button.') +
            panel('side="left"', 'left', '', 'Physical left.') +
            panel('side="right"', 'right', '', 'Physical right.'),
        ),
      ) +
        scene(
          'The two logical sides',
          'Switch the toolbar to rtl: these two swap and the physical pair does not. The arrow stays in the engine own coordinates either way, which is what keeps it pointing at the button.',
          viewport(
            panel('side="inline-start"', 'inline-start', '', 'Mirrors with the direction.') +
              panel('side="inline-end"', 'inline-end', '', 'And so does this one.'),
          ),
        ),
    ),
  }),
};

export const Anchor: Story = {
  parameters: scenario('anchor'),
  render: (_args, context) => ({
    props: { pictured: isolated(context) },
    template: grid(
      1,
      scene(
        'The panel hangs off the row, not off the button',
        'The button only opens it; the anchor is what it points at and is measured for. Nothing at all is written on the anchor element.',
        viewport(`
          <ng-container slPopover [portal]="false" side="bottom" align="end" [open]="pictured">
            <div slPopoverAnchor class="slotted-demo-rows">
              <span>Invoice 2026-014</span>
              <span><button slButton size="sm" tone="secondary" variant="ghost" slPopoverTrigger type="button">⋯</button></span>
            </div>
            <ng-template slPopoverLayer>
              <div slPopoverContent aria-label="Row actions">
                <div slPopoverBody>Duplicate, archive, delete.</div>
              </div>
              <div slPopoverArrow></div>
            </ng-template>
          </ng-container>`),
      ),
    ),
  }),
};

export const Focus: Story = {
  parameters: scenario('focus'),
  render: () => ({
    template: grid(
      3,
      scene(
        'The panel takes it',
        'The default. A reader hears the panel name before its contents, and a panel whose first control is destructive does not arrive pre-armed.',
        viewport(
          panel('side="bottom"', 'Panel first', 'Search', '<input aria-label="Search invoices" />'),
        ),
      ) +
        scene(
          'A control inside it takes it',
          'initialFocus takes an element or a selector read inside the panel. A filter panel that opens onto its own field wants this one.',
          viewport(
            panel(
              'side="bottom" initialFocus="input"',
              'Field first',
              'Search',
              '<input aria-label="Search invoices" />',
            ),
          ),
        ) +
        scene(
          'Nothing takes it',
          '[autoFocus]="false" leaves the focus on the trigger. Tab then reaches the next element on the page rather than the panel, so this is for a panel the reader is meant to read and not to fill in.',
          viewport(
            panel(
              'side="bottom" [autoFocus]="false"',
              'Focus stays',
              'Read only',
              'Nothing here asked for the keyboard.',
            ),
          ),
        ),
    ),
  }),
};

export const Dismissal: Story = {
  parameters: scenario('dismissal'),
  render: () => ({
    props: { reason: '—' },
    template: grid(
      1,
      scene(
        'Four ways out, four reasons',
        'Escape, a press outside, the close control, the trigger again. The reason of the last one is printed under the panel, and a consumer may refuse any of them before anything moves.',
        `${viewport(`
          <ng-container slPopover [portal]="false" side="bottom" (openChangeRequest)="reason = $event.reason">
            <button slButton tone="secondary" variant="outline" slPopoverTrigger type="button">Open me</button>
            <ng-template slPopoverLayer>
              <div slPopoverContent>
                <div slPopoverHeader>
                  <div slPopoverTitle>Try each one</div>
                  <p slPopoverDescription>Escape, outside, close, or the trigger again.</p>
                  <button slPopoverClose></button>
                </div>
                <div slPopoverBody>Each way out carries a different reason.</div>
              </div>
              <div slPopoverArrow></div>
            </ng-template>
          </ng-container>`)}${rows('Last reason', '{{ reason }}')}`,
      ),
    ),
  }),
};

export const Scrolling: Story = {
  parameters: scenario('scrolling'),
  render: (_args, context) => ({
    props: { pictured: isolated(context) },
    template: grid(
      1,
      scene(
        'The body is the only part that scrolls',
        'Bounded by the height the engine says is left. The title and the actions keep theirs, and the fade at the cut says there is more below — a panel bounded as a whole would have scrolled its own name out of sight.',
        viewport(
          panel(
            'side="bottom" [open]="pictured"',
            'Notifications',
            'Notification settings',
            '<p>Send me an email when an invoice is issued.</p><p>Send me an email when a payment fails.</p><p>Send me a weekly summary on Monday morning.</p><p>Send me an email when a dispute is opened.</p><p>Send me an email when a refund is settled.</p><p>Send me an email when the balance falls below the threshold.</p>',
            '<button slButton size="sm" type="button">Save</button>',
          ),
        ),
      ),
    ),
  }),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  decorators: [
    applicationConfig({
      providers: [providePopoverDefaults({ size: 'lg' })],
    }),
  ],
  render: () => ({
    template: grid(
      1,
      scene(
        'A form in a panel, portalled as it would be in an application',
        'This one keeps the default portal, so the layer is rendered at the end of the document and inherits the theme, scheme, density and direction of the region it was opened from. The controls inside are the consumer own.',
        viewport(`
          <ng-container
            slPopover
            side="bottom"
            initialFocus="input"
            [messages]="{ close: 'Close the panel' }"
          >
            <button slButton slPopoverTrigger type="button">New invoice</button>
            <ng-template slPopoverLayer>
              <div slPopoverContent>
                <div slPopoverHeader>
                  <div slPopoverTitle>New invoice</div>
                  <p slPopoverDescription>Drafts are not sent until you publish.</p>
                  <button slPopoverClose></button>
                </div>
                <div slPopoverBody>
                  <label for="popover-demo-customer">Customer</label>
                  <input id="popover-demo-customer" />
                </div>
                <div slPopoverFooter>
                  <button slButton size="sm" tone="secondary" variant="ghost" type="button">Cancel</button>
                  <button slButton size="sm" type="button">Create</button>
                </div>
              </div>
              <div slPopoverArrow></div>
            </ng-template>
          </ng-container>`),
      ),
    ),
  }),
};

export const Nested: Story = {
  parameters: scenario('nested'),
  render: () => ({
    template: grid(
      1,
      scene(
        'A tooltip on a control inside the panel',
        'Two layers at once. The tooltip is created later, so it takes a greater depth in the single stack: it draws above the panel and Escape reaches it first, closing it and leaving the panel open.',
        viewport(`
          <ng-container slPopover [portal]="false" side="bottom">
            <button slButton tone="secondary" variant="outline" slPopoverTrigger type="button">Filters</button>
            <ng-template slPopoverLayer>
              <div slPopoverContent>
                <div slPopoverHeader>
                  <div slPopoverTitle>Filter invoices</div>
                  <button slPopoverClose></button>
                </div>
                <div slPopoverBody>Hover the button below without closing this panel.</div>
                <div slPopoverFooter>
                  <ng-container slTooltip describes="label" [portal]="false" side="top">
                    <button slButton size="sm" tone="secondary" variant="ghost" slTooltipTrigger type="button">⌫</button>
                    <ng-template slTooltipLayer>
                      <div slTooltipContent>Clear the filters</div>
                      <div slTooltipArrow></div>
                    </ng-template>
                  </ng-container>
                  <button slButton size="sm" type="button">Apply</button>
                </div>
              </div>
              <div slPopoverArrow></div>
            </ng-template>
          </ng-container>`),
      ),
    ),
  }),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => ({
    template: grid(
      1,
      scene(
        'Enter, Tab, Tab, Tab',
        'Enter or Space opens it. Tab walks the two controls and, past the last one, reaches a focus guard: the panel closes and the focus returns to the trigger, from where the reading order continues down the page.',
        viewport(
          panel(
            'side="bottom"',
            'Open with Enter',
            'Tab through me',
            '<input aria-label="Search invoices" />',
            '<button slButton size="sm" type="button">Apply</button>',
          ),
        ),
      ),
    ),
  }),
};
