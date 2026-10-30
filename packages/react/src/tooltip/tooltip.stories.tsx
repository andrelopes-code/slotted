import { bindScenes, createReferencePage, isolated, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Button } from '../button';
import { Tooltip } from './tooltip';
import { TooltipDefaultsProvider } from './tooltip-defaults';
import { Grid, Scene, Viewport } from './tooltip-demo';
import { TooltipArrow, TooltipContent, TooltipLayer, TooltipTrigger } from './tooltip-parts';
import { REACT_TOOLTIP_DOCS, REACT_TOOLTIP_TOKENS } from './tooltip.docs';
import type { TooltipProps } from './tooltip.types';

/**
 * Every demonstration is `portal={false}` inside the workbench's own viewport
 * box, so a layer opened in one scene cannot draw over the scene above it. The
 * `composition` scene is the one that keeps the portal, and says so.
 */
function Hint({
  children,
  hint,
  ...props
}: Partial<TooltipProps> & { children: string; hint: string }) {
  return (
    <Tooltip portal={false} {...props}>
      <TooltipTrigger
        render={(triggerProps) => (
          <Button {...triggerProps} tone="secondary" variant="outline">
            {children}
          </Button>
        )}
      />
      <TooltipLayer>
        <TooltipContent>{hint}</TooltipContent>
        <TooltipArrow />
      </TooltipLayer>
    </Tooltip>
  );
}

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_TOOLTIP_DOCS.tooltip.scenes, {
    playground: Playground,
    variant: Variant,
    sizes: Sizes,
    placement: Placement,
    delay: Delay,
    describes: Describes,
    hoverable: Hoverable,
    content: Content,
    disabled: Disabled,
    composition: Composition,
    keyboard: Keyboard,
  });

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  parameters: {
    docs: {
      page: createReferencePage({
        ...REACT_TOOLTIP_DOCS.tooltip,
        description:
          'A short, non-interactive sentence about the element under the pointer or under focus. It never takes focus and never holds a control — the APG names the non-modal dialog for that, which is Popover.',
        framework: 'React',
        scenes: referenceScenes,
        title: 'Tooltip',
        tokens: REACT_TOOLTIP_TOKENS,
      }),
    },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: scenario('playground'),
  render: (_, context) => (
    <Grid>
      <Scene
        label="Hover, or Tab"
        note="The pointer waits out the 600 ms warmup; keyboard focus opens it in the same task, because a delay a reader cannot shorten by moving faster is a delay for nothing."
      >
        <Viewport>
          <Hint
            defaultOpen={isolated(context)}
            hint="Sends the draft to every subscriber on the list"
            side="bottom"
          >
            Publish
          </Hint>
        </Viewport>
      </Scene>
    </Grid>
  ),
};

export const Variant: Story = {
  parameters: scenario('variant'),
  render: (_, context) => (
    <Grid columns={2}>
      <Scene
        label="Inverse, on the page"
        note="A surface opposite to the page separates itself in every scheme without an edge, which is why it is the default and carries no border at all."
      >
        <Viewport>
          <Hint
            defaultOpen={isolated(context)}
            hint="Opposite to the page, in every scheme"
            side="bottom"
          >
            Inverse
          </Hint>
        </Viewport>
      </Scene>
      <Scene
        label="Surface, on a dark ground"
        note="On a page that is already dark the inverse hint is the brightest thing on it. The raised surface takes a hairline instead, and the arrow's outline continues it."
      >
        <Viewport inverse>
          <Tooltip defaultOpen={isolated(context)} portal={false} side="bottom" variant="surface">
            <TooltipTrigger
              render={(props) => (
                <Button {...props} tone="accent">
                  Surface
                </Button>
              )}
            />
            <TooltipLayer>
              <TooltipContent>Reads as a small panel rather than as a label</TooltipContent>
              <TooltipArrow />
            </TooltipLayer>
          </Tooltip>
        </Viewport>
      </Scene>
    </Grid>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: (_, context) => (
    <Grid>
      <Scene
        label="Small, and medium"
        note="Twelve pixels and thirteen. Switch the density in the toolbar: both tighten their padding and neither changes what it means, because both read the control scales."
      >
        <Viewport>
          <Hint
            defaultOpen={isolated(context)}
            hint="Twelve pixels, in a row that has no room"
            side="bottom"
            size="sm"
          >
            Small
          </Hint>
          <Hint
            defaultOpen={isolated(context)}
            hint="Thirteen pixels, everywhere else"
            side="bottom"
            size="md"
          >
            Medium
          </Hint>
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
          <Hint hint="Above" side="top">
            top
          </Hint>
          <Hint hint="Below" side="bottom">
            bottom
          </Hint>
          <Hint hint="Physical left" side="left">
            left
          </Hint>
          <Hint hint="Physical right" side="right">
            right
          </Hint>
        </Viewport>
      </Scene>
      <Scene
        label="The two logical sides"
        note="Switch the toolbar to rtl: these two swap and the physical pair above does not. No surveyed library but Base UI offers them, in a repository whose layout law is logical properties."
      >
        <Viewport>
          <Hint hint="Mirrors with the direction" side="inline-start">
            inline-start
          </Hint>
          <Hint hint="And so does this one" side="inline-end">
            inline-end
          </Hint>
        </Viewport>
      </Scene>
    </Grid>
  ),
};

export const Delay: Story = {
  parameters: scenario('delay'),
  render: () => (
    <Grid>
      <Scene
        label="The warmup, and the window after it"
        note="Cross the row quickly and nothing opens. Rest on one until it opens, then move to its neighbour: the second arrives with no delay, because the group window starts when the first one closes."
      >
        <TooltipDefaultsProvider groupDelay={400} openDelay={600}>
          <Viewport>
            <Hint hint="Copy the row" side="bottom">
              Duplicate
            </Hint>
            <Hint hint="Move it out of the list" side="bottom">
              Archive
            </Hint>
            <Hint hint="Remove it for good" side="bottom">
              Delete
            </Hint>
          </Viewport>
        </TooltipDefaultsProvider>
      </Scene>
    </Grid>
  ),
};

export const Describes: Story = {
  parameters: scenario('describes'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A description, on a labelled control"
        note="The button already says what it does; the hint adds a sentence about it, and the trigger points at it with aria-describedby only while it is open."
      >
        <Viewport>
          <Hint hint="Publishing cannot be undone from here" side="bottom">
            Publish
          </Hint>
        </Viewport>
      </Scene>
      <Scene
        label="A name, on a control that has none"
        note="An icon-only button described by its tooltip and named by nothing is announced as “button”. Under label the hint is the name, so the layer is in the document before anyone opens it."
      >
        <Viewport>
          <Tooltip describes="label" portal={false} side="bottom">
            <TooltipTrigger
              render={(props) => (
                <Button {...props} tone="secondary" variant="outline">
                  +
                </Button>
              )}
            />
            <TooltipLayer>
              <TooltipContent>Add a row</TooltipContent>
              <TooltipArrow />
            </TooltipLayer>
          </Tooltip>
        </Viewport>
      </Scene>
    </Grid>
  ),
};

export const Hoverable: Story = {
  parameters: scenario('hoverable'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="The pointer can land on it"
        note="Open it and move the pointer onto the hint: it stays. The distance between the button and the surface is the layer's own padding, so the pointer never crosses empty page — SC 1.4.13 Hoverable."
      >
        <Viewport>
          <Hint hint="Move the pointer onto me" side="bottom">
            Hoverable
          </Hint>
        </Viewport>
      </Scene>
      <Scene
        label="The pointer passes straight through"
        note="hoverable={false} takes the layer out of the pointer's way entirely, for a hint over something the reader has to keep clicking. It is a criterion before it is an option, so switching it off is a decision."
      >
        <Viewport>
          <Hint hoverable={false} hint="Nothing here takes the pointer" side="bottom">
            Not hoverable
          </Hint>
        </Viewport>
      </Scene>
    </Grid>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: (_, context) => (
    <Grid columns={3}>
      <Scene
        label="Long enough to meet the measure"
        note="The cap is a family token rather than an axis, because measure belongs to Container and to it alone. Past it the sentence wraps instead of setting one line the width of the page."
      >
        <Viewport>
          <Hint
            defaultOpen={isolated(context)}
            hint="Publishing sends the draft to every subscriber on the list and cannot be undone from here."
            side="bottom"
          >
            Long
          </Hint>
        </Viewport>
      </Scene>
      <Scene
        label="One unbroken token"
        note="overflow-wrap: anywhere breaks it rather than letting it run past the measure. A hostile string is a string with no spaces in it."
      >
        <Viewport>
          <Hint
            defaultOpen={isolated(context)}
            hint="webhook_delivery_failure_retry_backoff_seconds"
            side="bottom"
          >
            Unbroken
          </Hint>
        </Viewport>
      </Scene>
      <Scene
        label="Another script"
        note="unicode-bidi: plaintext takes each paragraph's direction from its own first strong character, so an Arabic hint reads right to left on this page and an English one reads left to right on an Arabic page."
      >
        <Viewport>
          <Hint
            defaultOpen={isolated(context)}
            hint="يحفظ المسودة دون نشرها على أي قائمة بريدية"
            side="bottom"
          >
            Translated
          </Hint>
        </Viewport>
      </Scene>
    </Grid>
  ),
};

export const Disabled: Story = {
  parameters: scenario('disabled'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="aria-disabled, which still reports the pointer"
        note="A control the page disabled with the native attribute fires no pointer events, so the one explanation of why it is disabled is the one nobody can reach. This shape keeps it focusable and reachable."
      >
        <Viewport>
          <Tooltip portal={false} side="bottom">
            <TooltipTrigger
              render={(props) => (
                <Button {...props} aria-disabled="true" tone="secondary" variant="outline">
                  Publish
                </Button>
              )}
            />
            <TooltipLayer>
              <TooltipContent>Publish once the invoice has a customer</TooltipContent>
              <TooltipArrow />
            </TooltipLayer>
          </Tooltip>
        </Viewport>
      </Scene>
      <Scene
        label="The family switched off"
        note="disabled on the Tooltip itself is a different thing: no layer is created at all, and the trigger never gets data-open. It is a configuration rather than a state, so nothing is painted for it."
      >
        <Viewport>
          <Hint disabled hint="This never appears" side="bottom">
            Nothing opens
          </Hint>
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
        label="A row of icon buttons, portalled as it would be in an application"
        note="These keep the default portal, so each layer is rendered at the end of the document and inherits the theme, scheme, density and direction of the region it was opened from. One provider names the hint and the delays for the whole row."
      >
        <TooltipDefaultsProvider describes="label" groupDelay={400} openDelay={400} size="sm">
          <Viewport>
            <Tooltip side="bottom">
              <TooltipTrigger
                render={(props) => (
                  <Button {...props} size="sm" tone="secondary" variant="ghost">
                    ↧
                  </Button>
                )}
              />
              <TooltipLayer>
                <TooltipContent>Download</TooltipContent>
                <TooltipArrow />
              </TooltipLayer>
            </Tooltip>
            <Tooltip side="bottom">
              <TooltipTrigger
                render={(props) => (
                  <Button {...props} size="sm" tone="secondary" variant="ghost">
                    ⧉
                  </Button>
                )}
              />
              <TooltipLayer>
                <TooltipContent>Duplicate</TooltipContent>
                <TooltipArrow />
              </TooltipLayer>
            </Tooltip>
            <Tooltip side="bottom">
              <TooltipTrigger
                render={(props) => (
                  <Button {...props} size="sm" tone="danger" variant="ghost">
                    ✕
                  </Button>
                )}
              />
              <TooltipLayer>
                <TooltipContent>Delete</TooltipContent>
                <TooltipArrow />
              </TooltipLayer>
            </Tooltip>
          </Viewport>
        </TooltipDefaultsProvider>
      </Scene>
    </Grid>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: function KeyboardStory() {
    const [reason, setReason] = useState('—');

    return (
      <Grid>
        <Scene
          label="Every key, and the reason it carries"
          note="Tab in and the hint opens without a delay. Escape dismisses it and the focus stays on the button. Enter activates the button and clears the hint away. The last reason the family emitted is printed under the row."
        >
          <Viewport>
            <Tooltip
              onOpenChange={(_open, request) => setReason(request.reason)}
              portal={false}
              side="bottom"
            >
              <TooltipTrigger
                render={(props) => (
                  <Button {...props} tone="secondary" variant="outline">
                    Tab to me
                  </Button>
                )}
              />
              <TooltipLayer>
                <TooltipContent>Escape dismisses without moving the focus</TooltipContent>
                <TooltipArrow />
              </TooltipLayer>
            </Tooltip>
          </Viewport>
          <div className="slotted-demo-rows">
            <span>Last reason</span>
            <span>{reason}</span>
          </div>
        </Scene>
      </Grid>
    );
  },
};
