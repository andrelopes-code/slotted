import { scenario, WorkbenchMatrix } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  ArrowRight,
  Bold,
  ChevronDown,
  ExternalLink,
  Italic,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Save,
  Star,
  Trash2,
  Underline,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from './button';
import { ButtonLink } from './button-link';
import { BUTTON_SIZES, BUTTON_TONES, BUTTON_VARIANTS } from './button.constants';
import type { ButtonTone, ButtonVariant } from './button.types';
import { IconButton } from './icon-button';
import { ToggleButton } from './toggle-button';

const demoIcons = {
  'arrow-right': ArrowRight,
  bold: Bold,
  'chevron-down': ChevronDown,
  'external-link': ExternalLink,
  italic: Italic,
  more: MoreHorizontal,
  plus: Plus,
  refresh: RefreshCw,
  save: Save,
  star: Star,
  trash: Trash2,
  underline: Underline,
} as const;

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function DemoIcon({ name }: { name: keyof typeof demoIcons }) {
  const Icon = demoIcons[name];
  return <Icon aria-hidden="true" focusable="false" strokeWidth={1.75} />;
}

function DemoScene({
  children,
  label,
  note,
}: {
  children: ReactNode;
  label: string;
  note: string;
}) {
  return (
    <section className="slotted-demo-scene">
      <header className="slotted-demo-scene__header">
        <span className="slotted-demo-scene__label">{label}</span>
        <span className="slotted-demo-scene__note">{note}</span>
      </header>
      <div className="slotted-demo-stage">{children}</div>
    </section>
  );
}

function LabSection({
  children,
  columns,
  description,
  title,
}: {
  children: ReactNode;
  columns?: '2' | '3';
  description: string;
  title: string;
}) {
  const bodyClassName = columns
    ? 'slotted-component-lab__body slotted-demo-grid'
    : 'slotted-component-lab__body';

  return (
    <section className="slotted-component-lab__section">
      <header className="slotted-component-lab__intro">
        <h2>{title}</h2>
        <p>{description}</p>
      </header>
      <div className={bodyClassName} data-columns={columns}>
        {children}
      </div>
    </section>
  );
}

function ToneMatrix({
  label,
  matrix,
  note,
  renderCell,
}: {
  label: string;
  matrix: string;
  note: string;
  renderCell: (tone: ButtonTone, variant: ButtonVariant) => ReactNode;
}) {
  return (
    <DemoScene label={label} note={note}>
      <div data-slotted-matrix={matrix}>
        <WorkbenchMatrix
          columns={BUTTON_TONES.map(titleCase)}
          rows={BUTTON_VARIANTS.map((variant) => ({
            label: titleCase(variant),
            cells: BUTTON_TONES.map((tone) => renderCell(tone, variant)),
          }))}
        />
      </div>
    </DemoScene>
  );
}

const meta = {
  title: 'Components/Button family/Overview',
  parameters: { controls: { disable: true } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Matrix: Story = {
  parameters: scenario('matrix'),
  render: () => (
    <main className="slotted-component-lab">
      <LabSection
        description="Four members, one surface. Button acts, ButtonLink navigates, IconButton acts without room for a label, and ToggleButton stays on. They share the tone, variant and size axes, so the appearance is decided once."
        title="Appearance system"
      >
        <ToneMatrix
          label="Tone by variant"
          matrix="button"
          note="Five semantic colours across four ways of painting them."
          renderCell={(tone, variant) => (
            <Button size="sm" tone={tone} variant={variant}>
              {titleCase(tone)}
            </Button>
          )}
        />
      </LabSection>

      <LabSection
        columns="2"
        description="A momentary action. It waits without changing size, and it wraps rather than pushing past a narrow container."
        title="Button"
      >
        <DemoScene label="Emphasis" note="One primary action per region.">
          <div className="slotted-demo-row">
            <Button start={<DemoIcon name="save" />}>Publish</Button>
            <Button tone="secondary" variant="outline">
              Save draft
            </Button>
            <Button tone="secondary" variant="ghost">
              Discard
            </Button>
          </div>
        </DemoScene>
        <DemoScene label="Waiting" note="The label stays, so the width and the name do too.">
          <div className="slotted-demo-row">
            <Button start={<DemoIcon name="save" />}>Save changes</Button>
            <Button loading>Save changes</Button>
          </div>
        </DemoScene>
        <DemoScene label="Sizes" note="Three steps of the control scale, at every density.">
          <div className="slotted-demo-row">
            {BUTTON_SIZES.map((size) => (
              <Button end={<DemoIcon name="chevron-down" />} key={size} size={size}>
                {size}
              </Button>
            ))}
          </div>
        </DemoScene>
        <DemoScene label="Extreme content" note="A long label wraps; a long token breaks.">
          <div className="slotted-demo-measure">
            <div className="slotted-demo-stack">
              <Button fullWidth>Export every invoice issued this quarter</Button>
              <Button size="sm" tone="secondary" variant="outline">
                reconciliation_2026_Q3_final.xlsx
              </Button>
            </div>
          </div>
        </DemoScene>
      </LabSection>

      <LabSection
        columns="2"
        description="An anchor wearing the action surface. It is announced as a link, activates on Enter alone, and loses its destination entirely when disabled."
        title="ButtonLink"
      >
        <DemoScene label="Navigation" note="Internal, external, and a router’s own link.">
          <div className="slotted-demo-row">
            <ButtonLink end={<DemoIcon name="arrow-right" />} href="/settings">
              Open settings
            </ButtonLink>
            <ButtonLink
              end={<DemoIcon name="external-link" />}
              href="https://example.com"
              rel="noreferrer"
              target="_blank"
              variant="outline"
            >
              Status page
            </ButtonLink>
            <ButtonLink
              render={(props) => <a {...props} data-router-link="true" href="/billing" />}
              variant="ghost"
            >
              Billing
            </ButtonLink>
          </div>
        </DemoScene>
        <DemoScene label="Unavailable" note="No href at all, and still reachable by keyboard.">
          <div className="slotted-demo-row">
            <ButtonLink disabled href="/settings">
              Open settings
            </ButtonLink>
          </div>
        </DemoScene>
      </LabSection>

      <LabSection
        columns="2"
        description="The same control with no room for a label, so the accessible name is an explicit attribute. Its box is square from the control height, which keeps the target at or above 24 by 24 at every density."
        title="IconButton"
      >
        <DemoScene label="Shape and size" note="Square or circular, at all three steps.">
          <div className="slotted-demo-row">
            {BUTTON_SIZES.map((size) => (
              <IconButton
                aria-label={`Add, ${size}`}
                key={size}
                size={size}
                tone="accent"
                variant="solid"
              >
                <DemoIcon name="plus" />
              </IconButton>
            ))}
            {BUTTON_SIZES.map((size) => (
              <IconButton
                aria-label={`Add, circle, ${size}`}
                key={`${size}-circle`}
                shape="circle"
                size={size}
                tone="accent"
                variant="solid"
              >
                <DemoIcon name="plus" />
              </IconButton>
            ))}
          </div>
        </DemoScene>
        <DemoScene label="A toolbar" note="Icon toggles keep their name while their state moves.">
          <div className="slotted-demo-row">
            <IconButton aria-label="Bold" defaultPressed size="sm">
              <DemoIcon name="bold" />
            </IconButton>
            <IconButton aria-label="Italic" defaultPressed={false} size="sm">
              <DemoIcon name="italic" />
            </IconButton>
            <IconButton aria-label="Underline" defaultPressed={false} size="sm">
              <DemoIcon name="underline" />
            </IconButton>
            <IconButton aria-label="More formatting" size="sm">
              <DemoIcon name="more" />
            </IconButton>
            <IconButton aria-label="Delete" size="sm" tone="danger">
              <DemoIcon name="trash" />
            </IconButton>
          </div>
        </DemoScene>
        <DemoScene label="Waiting" note="The icon fades and the ring takes its place, in its size.">
          <div className="slotted-demo-row">
            <IconButton aria-label="Refresh" variant="outline">
              <DemoIcon name="refresh" />
            </IconButton>
            <IconButton aria-label="Refresh" loading variant="outline">
              <DemoIcon name="refresh" />
            </IconButton>
          </div>
        </DemoScene>
        <DemoScene label="Unavailable" note="A disabled toggle still says whether it is on.">
          <div className="slotted-demo-row">
            <IconButton aria-label="Favourite" defaultPressed shape="circle" tone="warning">
              <DemoIcon name="star" />
            </IconButton>
            <IconButton
              aria-label="Favourite, unavailable"
              defaultPressed
              disabled
              shape="circle"
              tone="warning"
            >
              <DemoIcon name="star" />
            </IconButton>
          </div>
        </DemoScene>
      </LabSection>

      <LabSection
        columns="2"
        description="A two-state action. The label never changes with the state, and the request that moves it carries whether a pointer or the keyboard asked."
        title="ToggleButton"
      >
        <DemoScene
          label="On and off"
          note="The fill and a heavier edge, so neither scheme flattens it."
        >
          <div className="slotted-demo-row">
            <ToggleButton start={<DemoIcon name="star" />}>Favourite</ToggleButton>
            <ToggleButton defaultPressed start={<DemoIcon name="star" />}>
              Favourite
            </ToggleButton>
          </div>
        </DemoScene>
        <DemoScene label="Unavailable" note="Disabled wins over pressed, and pressed still shows.">
          <div className="slotted-demo-row">
            <ToggleButton disabled>Favourite</ToggleButton>
            <ToggleButton defaultPressed disabled>
              Favourite
            </ToggleButton>
          </div>
        </DemoScene>
      </LabSection>

      <LabSection
        description="Members side by side, in the composition an application actually writes."
        title="Composition"
      >
        <DemoScene label="A page header" note="One primary action, one secondary, one destructive.">
          <div className="slotted-demo-row">
            <Button start={<DemoIcon name="save" />}>Publish</Button>
            <ButtonLink href="/preview" variant="outline">
              Preview
            </ButtonLink>
            <IconButton aria-label="More actions" variant="outline">
              <DemoIcon name="more" />
            </IconButton>
            <Button tone="danger" variant="ghost">
              Delete
            </Button>
          </div>
        </DemoScene>
      </LabSection>
    </main>
  ),
};

/** Every tone in every variant, at one size, for comparing the palette itself. */
export const Tones: Story = {
  parameters: scenario('tones'),
  render: () => (
    <div className="slotted-demo-stage">
      {BUTTON_TONES.map((tone) => (
        <div className="slotted-demo-row" key={tone}>
          {BUTTON_VARIANTS.map((variant) => (
            <Button key={variant} tone={tone} variant={variant}>
              {titleCase(tone)}
            </Button>
          ))}
          <IconButton aria-label={`Add, ${tone}`} tone={tone} variant="solid">
            <DemoIcon name="plus" />
          </IconButton>
        </div>
      ))}
    </div>
  ),
};

/**
 * Density changes the size of a control and nothing about its meaning. The
 * toolbar switches it from the Storybook toolbar; this scene is what shows the
 * three steps against each other at whichever one is selected.
 */
export const Densities: Story = {
  parameters: scenario('densities'),
  render: () => (
    <div className="slotted-demo-stage">
      {BUTTON_SIZES.map((size) => (
        <div className="slotted-demo-row" key={size}>
          <Button size={size} start={<DemoIcon name="save" />}>
            Save changes
          </Button>
          <Button size={size} variant="outline">
            Cancel
          </Button>
          <IconButton aria-label={`More, ${size}`} size={size} variant="outline">
            <DemoIcon name="more" />
          </IconButton>
          <ToggleButton defaultPressed size={size}>
            Pinned
          </ToggleButton>
        </div>
      ))}
    </div>
  ),
};
