import { createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChevronDown, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from './button';
import { ButtonDefaultsProvider } from './button-defaults';
import { BUTTON_SIZES, BUTTON_TONES, BUTTON_VARIANTS } from './button.constants';
import { REACT_BUTTON_DOCS, REACT_BUTTON_TOKENS } from './button.docs';
import type { ButtonRootProps } from './button.types';

const SaveIcon = () => <Save aria-hidden="true" focusable="false" strokeWidth={1.75} />;
const ChevronIcon = () => <ChevronDown aria-hidden="true" focusable="false" strokeWidth={1.75} />;
const TrashIcon = () => <Trash2 aria-hidden="true" focusable="false" strokeWidth={1.75} />;

const referenceStories: ReferencePageConfig['stories'] = () => ({
  essential: Playground as never,
  matrix: Variants as never,
});

const meta = {
  title: 'Components/Button family/Button',
  component: Button,
  args: {
    children: 'Save changes',
    disabled: false,
    fullWidth: false,
    loading: false,
    size: 'md',
    tone: 'accent',
    variant: 'solid',
  },
  argTypes: {
    size: { control: 'select', options: [...BUTTON_SIZES] },
    tone: { control: 'select', options: [...BUTTON_TONES] },
    variant: { control: 'select', options: [...BUTTON_VARIANTS] },
  },
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Button',
        description: 'A momentary action, on the platform’s own button element.',
        framework: 'React',
        ...REACT_BUTTON_DOCS.button,
        tokens: REACT_BUTTON_TOKENS,
        stories: referenceStories,
      }),
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: { ...scenario('playground'), controls: { disable: false } },
};

/** The emphasis ladder: one primary action per region, and everything else below it. */
export const Variants: Story = {
  parameters: scenario('variants'),
  render: () => (
    <div className="slotted-demo-stage">
      {BUTTON_TONES.map((tone) => (
        <div className="slotted-demo-row" key={tone}>
          {BUTTON_VARIANTS.map((variant) => (
            <Button key={variant} tone={tone} variant={variant}>
              {tone}
            </Button>
          ))}
        </div>
      ))}
    </div>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <div className="slotted-demo-stage">
      <div className="slotted-demo-row">
        <Button start={<SaveIcon />}>Save</Button>
        <Button end={<ChevronIcon />} variant="outline">
          Save and…
        </Button>
        <Button end={<ChevronIcon />} start={<SaveIcon />} variant="ghost">
          Save
        </Button>
      </div>
      <div className="slotted-demo-row">
        {BUTTON_SIZES.map((size) => (
          <Button key={size} size={size} start={<SaveIcon />}>
            {size}
          </Button>
        ))}
      </div>
    </div>
  ),
};

/**
 * Disabled and loading both refuse the action, and say so differently: the
 * first is unavailable, the second is already working.
 *
 * `focusableWhenDisabled` decides which of the two ways a control is made
 * unavailable. Without it the platform's `disabled` also takes the control out
 * of the tab sequence, which takes its tooltip and its explanation with it;
 * with it the control announces `aria-disabled`, stays reachable, and refuses
 * the activation just the same.
 */
export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <div className="slotted-demo-stage">
      {BUTTON_VARIANTS.map((variant) => (
        <div className="slotted-demo-row" key={variant}>
          <Button variant={variant}>{variant}</Button>
          <Button disabled variant={variant}>
            Disabled
          </Button>
          <Button disabled focusableWhenDisabled variant={variant}>
            Disabled, reachable
          </Button>
          <Button loading variant={variant}>
            Loading
          </Button>
          <Button start={<TrashIcon />} tone="danger" variant={variant}>
            Delete
          </Button>
        </div>
      ))}
    </div>
  ),
};

/**
 * A band of the control's own ink crosses it for as long as it waits, and the
 * control keeps everything it was showing: the width is the same before and
 * after, the glyph stays in its slot, and the label a person just pressed
 * stays readable. The ring the band replaced had to be drawn over that label
 * whenever the control had no icon to lend it a box.
 *
 * The ring is still there. It is the element that carries `progressbar` and
 * the name of the wait, so it steps out of the flow rather than out of the
 * accessibility tree, and it is drawn again wherever the band cannot be: on an
 * icon-only control, which has no label to spare, and under reduced motion or
 * forced colours, where an engine has no band to give.
 *
 * The matrix is every tone against every variant, because `currentColor` is
 * what paints the band: the ink the control is already writing its label with
 * contrasts with that control's ground by construction, at every tone, in
 * every scheme.
 *
 * The last of the three waits behind a delay. The action is refused from the
 * first millisecond either way; the delay only decides whether a person sees a
 * wait for an action that was over before they could read it.
 */
export const Loading: Story = {
  parameters: scenario('loading'),
  render: function LoadingStory() {
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const wait = (start: (value: boolean) => void, ms: number) => {
      start(true);
      window.setTimeout(() => start(false), ms);
    };

    return (
      <div className="slotted-demo-stage">
        <div className="slotted-demo-row">
          <Button
            loading={saving}
            messages={{ loading: 'Saving' }}
            onClick={() => wait(setSaving, 2000)}
            start={<SaveIcon />}
          >
            Save changes
          </Button>
          <Button loading messages={{ loading: 'Adding' }} variant="outline">
            Add member
          </Button>
          <Button
            loading={publishing}
            loadingDelay={400}
            messages={{ loading: 'Publishing' }}
            onClick={() => wait(setPublishing, 250)}
            start={<SaveIcon />}
            variant="outline"
          >
            Publish (fast, no flash)
          </Button>
        </div>
        {BUTTON_VARIANTS.map((variant) => (
          <div className="slotted-demo-row" key={variant}>
            {BUTTON_TONES.map((tone) => (
              <Button
                key={tone}
                loading
                messages={{ loading: `${tone} ${variant}` }}
                start={<SaveIcon />}
                tone={tone}
                variant={variant}
              >
                {tone}
              </Button>
            ))}
            {BUTTON_TONES.map((tone) => (
              <Button
                key={`${tone}-words`}
                loading
                messages={{ loading: `${tone} ${variant}, no glyph` }}
                tone={tone}
                variant={variant}
              >
                {tone}
              </Button>
            ))}
          </div>
        ))}
        <div className="slotted-demo-row">
          {BUTTON_SIZES.map((size) => (
            <Button
              key={size}
              loading
              messages={{ loading: size }}
              size={size}
              start={<SaveIcon />}
            >
              {size}
            </Button>
          ))}
          {BUTTON_SIZES.map((size) => (
            <Button
              key={`${size}-words`}
              loading
              messages={{ loading: size }}
              size={size}
              variant="outline"
            >
              {size}
            </Button>
          ))}
        </div>
      </div>
    );
  },
};

/**
 * The root's own props, handed to something else to render. It is how the
 * surface reaches a tooltip trigger, a menu trigger or a consumer's own wrapper
 * without the family growing a prop for each of them. The props are a button
 * element's, because the element stays a button: navigation wearing this
 * surface is ButtonLink, which has a `render` of its own for a router's link.
 *
 * The Angular binding needs no equivalent. Every member there is a directive on
 * the element the consumer wrote, so substituting it is done by writing a
 * different element.
 */
export const Composition: Story = {
  parameters: scenario('composition'),
  render: function CompositionStory() {
    const Tracked = ({ event, ...rootProps }: ButtonRootProps & { event: string }) => (
      <button {...rootProps} data-analytics={event} />
    );

    return (
      <div className="slotted-demo-row">
        <Button
          render={(rootProps) => <Tracked {...rootProps} event="save" />}
          start={<SaveIcon />}
        >
          Wrapped by the consumer
        </Button>
        <Button
          render={(rootProps) => <button {...rootProps} form="preferences" />}
          type="submit"
          variant="outline"
        >
          Submits a form elsewhere
        </Button>
      </div>
    );
  },
};

/**
 * An application decides once how its actions are painted, rather than
 * repeating three props on every button. An axis the provider leaves unset
 * keeps each member its own default, and a button that states an axis itself
 * always wins.
 */
export const Defaults: Story = {
  parameters: scenario('defaults'),
  render: () => (
    <ButtonDefaultsProvider size="sm" tone="success">
      <div className="slotted-demo-row">
        <Button>Inherits size and tone</Button>
        <Button variant="outline">And keeps its own paint</Button>
        <Button size="lg" tone="danger">
          States both itself
        </Button>
      </div>
    </ButtonDefaultsProvider>
  ),
};

export const FullWidth: Story = {
  parameters: scenario('fullWidth'),
  render: () => (
    <div className="slotted-demo-measure">
      <div className="slotted-demo-stack">
        <Button fullWidth start={<SaveIcon />}>
          Confirm and continue
        </Button>
        <Button fullWidth variant="outline">
          Export every invoice issued this quarter
        </Button>
      </div>
    </div>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <div className="slotted-demo-stack">
      <Button aria-describedby="save-help">Save</Button>
      <p id="save-help">Saves the current document and stays on the page.</p>
      <Button aria-describedby="delete-help" tone="danger" variant="outline">
        Delete workspace
      </Button>
      <p id="delete-help">Deletes the workspace and everything in it. This cannot be undone.</p>
    </div>
  ),
};
