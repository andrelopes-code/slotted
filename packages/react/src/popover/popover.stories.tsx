import { bindScenes, createReferencePage, isolated, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Button } from '../button';
import { Tooltip } from '../tooltip';
import {
  TooltipArrow,
  TooltipContent,
  TooltipLayer,
  TooltipTrigger,
} from '../tooltip/tooltip-parts';
import { Popover } from './popover';
import { PopoverDefaultsProvider } from './popover-defaults';
import { Grid, Scene, Viewport } from './popover-demo';
import {
  PopoverAnchor,
  PopoverArrow,
  PopoverBody,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverFooter,
  PopoverHeader,
  PopoverLayer,
  PopoverTitle,
  PopoverTrigger,
} from './popover-parts';
import { REACT_POPOVER_DOCS, REACT_POPOVER_TOKENS } from './popover.docs';
import type { PopoverProps } from './popover.types';

/**
 * Every demonstration is `portal={false}` inside the workbench's own viewport
 * box, so a panel opened in one scene cannot draw over the scene above it. The
 * `composition` scene keeps the portal, and says so.
 */
function Panel({
  body,
  children,
  description,
  footer,
  title,
  ...props
}: Partial<PopoverProps> & {
  body: ReactNode;
  children: string;
  description?: string;
  footer?: ReactNode;
  title?: string;
}) {
  return (
    <Popover portal={false} {...props}>
      <PopoverTrigger
        render={(triggerProps) => (
          <Button {...triggerProps} tone="secondary" variant="outline">
            {children}
          </Button>
        )}
      />
      <PopoverLayer>
        <PopoverContent {...(title === undefined ? { 'aria-label': children } : {})}>
          {title === undefined ? null : (
            <PopoverHeader>
              <PopoverTitle>{title}</PopoverTitle>
              {description === undefined ? null : (
                <PopoverDescription>{description}</PopoverDescription>
              )}
              <PopoverClose />
            </PopoverHeader>
          )}
          <PopoverBody>{body}</PopoverBody>
          {footer === undefined ? null : <PopoverFooter>{footer}</PopoverFooter>}
        </PopoverContent>
        <PopoverArrow />
      </PopoverLayer>
    </Popover>
  );
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_POPOVER_DOCS.popover.scenes, {
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

const meta = {
  title: 'Components/Popover',
  component: Popover,
  parameters: {
    docs: {
      page: createReferencePage({
        ...REACT_POPOVER_DOCS.popover,
        description:
          'Interactive, non-modal content anchored to the control that opened it. Nothing behind it becomes inert, the page keeps scrolling and focus is not contained — the modal surface is Dialog.',
        framework: 'React',
        scenes: referenceScenes,
        title: 'Popover',
        tokens: REACT_POPOVER_TOKENS,
      }),
    },
  },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: scenario('playground'),
  render: (_args, context) => (
    <Grid>
      <Scene
        label="Press, and the panel takes the focus"
        note="It focuses the panel itself rather than its first control, so a reader hears the panel's name before its contents. Escape closes it and the focus goes back to the button."
      >
        <Viewport>
          <Panel
            defaultOpen={isolated(context)}
            body="Unpaid, overdue and disputed invoices issued in the last quarter."
            description="Applies to the current view only."
            footer={
              <>
                <Button size="sm" tone="secondary" variant="ghost">
                  Reset
                </Button>
                <Button size="sm">Apply</Button>
              </>
            }
            title="Filter invoices"
          >
            Filters
          </Panel>
        </Viewport>
      </Scene>
    </Grid>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: (_args, context) => (
    <Grid columns={2}>
      <Scene
        label="Small — sixteen rems"
        note="The tighter inset and the medium title step, for a panel that holds a sentence and a control."
      >
        <Viewport>
          <Panel
            defaultOpen={isolated(context)}
            body="The tighter inset and the medium type step."
            size="sm"
            title="Small"
          >
            Small
          </Panel>
        </Viewport>
      </Scene>
      <Scene
        label="Medium — twenty rems"
        note="The step every popover starts at, and the one the provider changes when a product wants another."
      >
        <Viewport>
          <Panel
            defaultOpen={isolated(context)}
            body="The step every popover starts at."
            size="md"
            title="Medium"
          >
            Medium
          </Panel>
        </Viewport>
      </Scene>
      <Scene
        label="Large — twenty-four rems"
        note="For a panel that holds a form. The panel's own inset is on the space scale, as Card's and Alert's are, and density moves what it holds."
      >
        <Viewport>
          <Panel
            body="For a panel that holds a form rather than a sentence."
            defaultOpen={isolated(context)}
            size="lg"
            title="Large"
          >
            Large
          </Panel>
        </Viewport>
      </Scene>
    </Grid>
  ),
};

export const Width: Story = {
  parameters: scenario('width'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="As wide as its own words"
        note="auto sizes the panel to its content and stops at the measure its size step gives it. Past that the text wraps rather than setting one line the width of the page."
      >
        <Viewport>
          <Panel align="start" body="Sized by what is written in it." width="auto">
            Automatic
          </Panel>
        </Viewport>
      </Scene>
      <Scene
        label="As wide as the control it hangs from"
        note="anchor reads the anchor's measured width, which is the one case Radix publishes a custom property for and never uses. It is what a filter panel under a search field needs."
      >
        <Viewport>
          <Panel align="start" body="Exactly as wide as the button above." width="anchor">
            An unusually wide trigger
          </Panel>
        </Viewport>
      </Scene>
    </Grid>
  ),
};

export const Placement: Story = {
  parameters: scenario('placement'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="The four physical sides"
        note="Each button asks for one edge. Narrow the window until one collides and it flips to the opposite side, then slides along it rather than leaving the screen."
      >
        <Viewport>
          <Panel body="Above the button." side="top">
            top
          </Panel>
          <Panel body="Below the button." side="bottom">
            bottom
          </Panel>
          <Panel body="Physical left." side="left">
            left
          </Panel>
          <Panel body="Physical right." side="right">
            right
          </Panel>
        </Viewport>
      </Scene>
      <Scene
        label="The two logical sides"
        note="Switch the toolbar to rtl: these two swap and the physical pair does not. The arrow stays in the engine's own coordinates either way, which is what keeps it pointing at the button."
      >
        <Viewport>
          <Panel body="Mirrors with the direction." side="inline-start">
            inline-start
          </Panel>
          <Panel body="And so does this one." side="inline-end">
            inline-end
          </Panel>
        </Viewport>
      </Scene>
    </Grid>
  ),
};

export const Anchor: Story = {
  parameters: scenario('anchor'),
  render: (_args, context) => (
    <Grid>
      <Scene
        label="The panel hangs off the row, not off the button"
        note="The button only opens it; the anchor is what it points at and is measured for. Nothing at all is written on the anchor element."
      >
        <Viewport>
          <Popover align="end" defaultOpen={isolated(context)} portal={false} side="bottom">
            <PopoverAnchor>
              <div className="slotted-demo-rows">
                <span>Invoice 2026-014</span>
                <PopoverTrigger
                  render={(props) => (
                    <Button {...props} size="sm" tone="secondary" variant="ghost">
                      ⋯
                    </Button>
                  )}
                />
              </div>
            </PopoverAnchor>
            <PopoverLayer>
              <PopoverContent aria-label="Row actions">
                <PopoverBody>Duplicate, archive, delete.</PopoverBody>
              </PopoverContent>
              <PopoverArrow />
            </PopoverLayer>
          </Popover>
        </Viewport>
      </Scene>
    </Grid>
  ),
};

export const Focus: Story = {
  parameters: scenario('focus'),
  render: () => (
    <Grid columns={3}>
      <Scene
        label="The panel takes it"
        note="The default. A reader hears the panel's name before its contents, and a panel whose first control is destructive does not arrive pre-armed."
      >
        <Viewport>
          <Panel body={<input aria-label="Search invoices" />} title="Search">
            Panel first
          </Panel>
        </Viewport>
      </Scene>
      <Scene
        label="A control inside it takes it"
        note="initialFocus takes an element, a ref or a selector read inside the panel. A filter panel that opens onto its own field wants this one."
      >
        <Viewport>
          <Panel body={<input aria-label="Search invoices" />} initialFocus="input" title="Search">
            Field first
          </Panel>
        </Viewport>
      </Scene>
      <Scene
        label="Nothing takes it"
        note="autoFocus={false} leaves the focus on the trigger. Tab then reaches the next element on the page rather than the panel, so this is for a panel the reader is meant to read and not to fill in."
      >
        <Viewport>
          <Panel autoFocus={false} body="Nothing here asked for the keyboard." title="Read only">
            Focus stays
          </Panel>
        </Viewport>
      </Scene>
    </Grid>
  ),
};

export const Dismissal: Story = {
  parameters: scenario('dismissal'),
  render: function DismissalStory() {
    const [reason, setReason] = useState('—');
    const [guarded, setGuarded] = useState(true);

    return (
      <Grid columns={2}>
        <Scene
          label="Four ways out, four reasons"
          note="Escape, a press outside, the close control, the trigger again. The reason of the last one is printed under the panel."
        >
          <Viewport>
            <Popover
              onOpenChange={(_open, request) => setReason(request.reason)}
              portal={false}
              side="bottom"
            >
              <PopoverTrigger
                render={(props) => (
                  <Button {...props} tone="secondary" variant="outline">
                    Open me
                  </Button>
                )}
              />
              <PopoverLayer>
                <PopoverContent>
                  <PopoverHeader>
                    <PopoverTitle>Try each one</PopoverTitle>
                    <PopoverClose />
                  </PopoverHeader>
                  <PopoverBody>Escape, outside, close, or the trigger again.</PopoverBody>
                </PopoverContent>
                <PopoverArrow />
              </PopoverLayer>
            </Popover>
          </Viewport>
          <div className="slotted-demo-rows">
            <span>Last reason</span>
            <span>{reason}</span>
          </div>
        </Scene>
        <Scene
          label="A request the consumer refuses"
          note="This one cancels every outsidePress while the switch below is on, which is the shape a panel with unsaved edits needs. Escape and the close control still work."
        >
          <Viewport>
            <Popover
              onOpenChange={(_open, request) => {
                if (guarded && request.reason === 'outsidePress') request.cancel();
              }}
              portal={false}
              side="bottom"
            >
              <PopoverTrigger
                render={(props) => (
                  <Button {...props} tone="secondary" variant="outline">
                    Unsaved edits
                  </Button>
                )}
              />
              <PopoverLayer>
                <PopoverContent>
                  <PopoverHeader>
                    <PopoverTitle>Refusing the outside press</PopoverTitle>
                    <PopoverClose />
                  </PopoverHeader>
                  <PopoverBody>Press outside: nothing happens while the guard is on.</PopoverBody>
                </PopoverContent>
                <PopoverArrow />
              </PopoverLayer>
            </Popover>
          </Viewport>
          <div className="slotted-demo-rows">
            <span>Guard</span>
            <span>
              <Button onClick={() => setGuarded(!guarded)} size="sm" variant="outline">
                {guarded ? 'on' : 'off'}
              </Button>
            </span>
          </div>
        </Scene>
      </Grid>
    );
  },
};

export const Scrolling: Story = {
  parameters: scenario('scrolling'),
  render: (_args, context) => (
    <Grid>
      <Scene
        label="The body is the only part that scrolls"
        note="Bounded by the height the engine says is left. The title and the actions keep theirs, and the fade at the cut says there is more below — a panel bounded as a whole would have scrolled its own name out of sight."
      >
        <Viewport>
          <Panel
            defaultOpen={isolated(context)}
            body={
              <>
                <p>Send me an email when an invoice is issued.</p>
                <p>Send me an email when a payment fails.</p>
                <p>Send me a weekly summary on Monday morning.</p>
                <p>Send me an email when a dispute is opened.</p>
                <p>Send me an email when a refund is settled.</p>
                <p>Send me an email when the balance falls below the threshold.</p>
              </>
            }
            footer={<Button size="sm">Save</Button>}
            title="Notification settings"
          >
            Notifications
          </Panel>
        </Viewport>
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <Grid>
      <Scene
        label="A form in a panel, portalled as it would be in an application"
        note="This one keeps the default portal, so the layer is rendered at the end of the document and inherits the theme, scheme, density and direction of the region it was opened from. The controls inside are the consumer's own."
      >
        <PopoverDefaultsProvider size="lg">
          <Viewport>
            <Popover initialFocus="input" messages={{ close: 'Close the panel' }} side="bottom">
              <PopoverTrigger render={(props) => <Button {...props}>New invoice</Button>} />
              <PopoverLayer>
                <PopoverContent>
                  <PopoverHeader>
                    <PopoverTitle>New invoice</PopoverTitle>
                    <PopoverDescription>Drafts are not sent until you publish.</PopoverDescription>
                    <PopoverClose />
                  </PopoverHeader>
                  <PopoverBody>
                    <label htmlFor="popover-demo-customer">Customer</label>
                    <input id="popover-demo-customer" />
                  </PopoverBody>
                  <PopoverFooter>
                    <Button size="sm" tone="secondary" variant="ghost">
                      Cancel
                    </Button>
                    <Button size="sm">Create</Button>
                  </PopoverFooter>
                </PopoverContent>
                <PopoverArrow />
              </PopoverLayer>
            </Popover>
          </Viewport>
        </PopoverDefaultsProvider>
      </Scene>
    </Grid>
  ),
};

export const Nested: Story = {
  parameters: scenario('nested'),
  render: (_args, context) => (
    <Grid>
      <Scene
        label="A tooltip on a control inside the panel"
        note="Two layers at once. The tooltip is created later, so it takes a greater depth in the single stack: it draws above the panel and Escape reaches it first, closing it and leaving the panel open."
      >
        <Viewport>
          <Popover defaultOpen={isolated(context)} portal={false} side="bottom">
            <PopoverTrigger
              render={(props) => (
                <Button {...props} tone="secondary" variant="outline">
                  Filters
                </Button>
              )}
            />
            <PopoverLayer>
              <PopoverContent>
                <PopoverHeader>
                  <PopoverTitle>Filter invoices</PopoverTitle>
                  <PopoverClose />
                </PopoverHeader>
                <PopoverBody>Hover the button below without closing this panel.</PopoverBody>
                <PopoverFooter>
                  <Tooltip describes="label" portal={false} side="top">
                    <TooltipTrigger
                      render={(props) => (
                        <Button {...props} size="sm" tone="secondary" variant="ghost">
                          ⌫
                        </Button>
                      )}
                    />
                    <TooltipLayer>
                      <TooltipContent>Clear the filters</TooltipContent>
                      <TooltipArrow />
                    </TooltipLayer>
                  </Tooltip>
                  <Button size="sm">Apply</Button>
                </PopoverFooter>
              </PopoverContent>
              <PopoverArrow />
            </PopoverLayer>
          </Popover>
        </Viewport>
      </Scene>
    </Grid>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <Grid>
      <Scene
        label="Enter, Tab, Tab, Tab"
        note="Enter or Space opens it. Tab walks the two controls and, past the last one, reaches a focus guard: the panel closes and the focus returns to the trigger, from where the reading order continues down the page."
      >
        <Viewport>
          <Panel
            body={<input aria-label="Search invoices" />}
            footer={<Button size="sm">Apply</Button>}
            title="Tab through me"
          >
            Open with Enter
          </Panel>
        </Viewport>
      </Scene>
    </Grid>
  ),
};
