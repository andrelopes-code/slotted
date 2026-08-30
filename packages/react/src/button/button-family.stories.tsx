import type { Meta, StoryObj } from '@storybook/react-vite';
import { scenario, WorkbenchMatrix } from '@slotted/storybook-workbench';
import {
  ArrowRight,
  Bold,
  ChevronDown,
  ExternalLink,
  Italic,
  Plus,
  Redo2,
  Save,
  Trash2,
  Underline,
  Undo2,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from './button';
import { ButtonGroup } from './button-group';
import { ButtonLink } from './button-link';
import { IconButton } from './icon-button';
import { ToggleButton } from './toggle-button';

const demoIcons = {
  'arrow-right': ArrowRight,
  bold: Bold,
  'chevron-down': ChevronDown,
  'external-link': ExternalLink,
  italic: Italic,
  plus: Plus,
  redo: Redo2,
  save: Save,
  trash: Trash2,
  underline: Underline,
  undo: Undo2,
} as const;
const variants = ['accent', 'secondary', 'success', 'warning', 'danger'] as const;
const fills = ['solid', 'outline', 'ghost'] as const;
const sizes = ['sm', 'md', 'lg'] as const;

type Variant = (typeof variants)[number];
type Fill = (typeof fills)[number];

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

function MatrixScene({
  label,
  matrix,
  note,
  renderCell,
}: {
  label: string;
  matrix: string;
  note: string;
  renderCell: (variant: Variant, fill: Fill) => ReactNode;
}) {
  return (
    <DemoScene label={label} note={note}>
      <div data-slotted-matrix={matrix}>
        <WorkbenchMatrix
          columns={variants.map(titleCase)}
          rows={fills.map((fill) => ({
            label: titleCase(fill),
            cells: variants.map((variant) => renderCell(variant, fill)),
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
        description="Five semantic variants across three fills. ButtonLink, IconButton and ToggleButton read from the same axes, so this matrix is shown once."
        title="Appearance system"
      >
        <MatrixScene
          label="Appearance matrix"
          matrix="button"
          note="Rendered with Button. The same tokens drive every component below."
          renderCell={(variant, fill) => (
            <Button fill={fill} key={variant} variant={variant}>
              {titleCase(variant)}
            </Button>
          )}
        />
      </LabSection>

      <LabSection
        columns="2"
        description="The native action primitive: scale, interaction state, and consumer content."
        title="Button"
      >
        <DemoScene label="Sizes" note="Three explicit control heights.">
          <div className="slotted-demo-row">
            {sizes.map((size) => (
              <Button key={size} size={size}>
                {size === 'sm' ? 'Small' : size === 'md' ? 'Medium' : 'Large'}
              </Button>
            ))}
          </div>
        </DemoScene>
        <DemoScene label="States" note="Default, unavailable, and in progress.">
          <div className="slotted-demo-row">
            <Button>Default</Button>
            <Button disabled>Disabled</Button>
            <Button loading loadingText="Saving">
              Save
            </Button>
          </div>
        </DemoScene>
        <DemoScene label="Content" note="Replaceable icon slots and full-width layout.">
          <div className="slotted-demo-stack slotted-demo-measure">
            <Button leading={<DemoIcon name="save" />} trailing={<DemoIcon name="chevron-down" />}>
              Save draft
            </Button>
            <Button fullWidth leading={<DemoIcon name="plus" />}>
              Create document
            </Button>
          </div>
        </DemoScene>
        <DemoScene label="Hierarchy" note="Primary and secondary actions remain unmistakable.">
          <div className="slotted-demo-row">
            <Button>Primary action</Button>
            <Button fill="outline" variant="secondary">
              Secondary action
            </Button>
          </div>
        </DemoScene>
      </LabSection>

      <LabSection
        columns="3"
        description="Navigation that reads as an action. What differs from Button is the element it renders, not the appearance."
        title="ButtonLink"
      >
        <DemoScene
          label="Anchor semantics"
          note="Renders a real anchor. Middle-click, copy link, and browser navigation all work."
        >
          <div className="slotted-demo-row">
            <ButtonLink href="/docs/button" trailing={<DemoIcon name="arrow-right" />}>
              Read the guide
            </ButtonLink>
            <ButtonLink
              fill="ghost"
              href="https://developer.mozilla.org/docs/Web/HTML/Element/a"
              rel="noreferrer"
              target="_blank"
              trailing={<DemoIcon name="external-link" />}
              variant="secondary"
            >
              MDN reference
            </ButtonLink>
          </div>
        </DemoScene>
        <DemoScene
          label="Unavailable"
          note="disabled keeps the anchor in the DOM, sets aria-disabled, and removes it from the tab order."
        >
          <div className="slotted-demo-row">
            <ButtonLink disabled fill="outline" href="/billing/upgrade" variant="secondary">
              Upgrade plan
            </ButtonLink>
          </div>
        </DemoScene>
        <DemoScene
          label="Beside an action"
          note="Submission stays a button; navigation stays a link at a quieter fill."
        >
          <div className="slotted-demo-row">
            <Button leading={<DemoIcon name="save" />}>Save changes</Button>
            <ButtonLink fill="ghost" href="/documents" variant="secondary">
              Back to documents
            </ButtonLink>
          </div>
        </DemoScene>
      </LabSection>

      <LabSection
        columns="3"
        description="Icon-only actions. The footprint is square and the accessible name is mandatory."
        title="IconButton"
      >
        <DemoScene
          label="Square footprint"
          note="Inline size tracks the control height at every size — no label padding."
        >
          <div className="slotted-demo-row">
            {sizes.map((size) => (
              <IconButton
                aria-label={`Add item (${size})`}
                fill="outline"
                key={size}
                size={size}
                variant="secondary"
              >
                <DemoIcon name="plus" />
              </IconButton>
            ))}
          </div>
        </DemoScene>
        <DemoScene label="Fills" note="The same three fills, carried without a text label.">
          <div className="slotted-demo-row">
            {fills.map((fill) => (
              <IconButton aria-label={`Save ${fill}`} fill={fill} key={fill} variant="accent">
                <DemoIcon name="save" />
              </IconButton>
            ))}
          </div>
        </DemoScene>
        <DemoScene
          label="Accessible name"
          note="aria-label is required; development builds throw when it is missing."
        >
          <div className="slotted-demo-row">
            <IconButton aria-label="Undo">
              <DemoIcon name="undo" />
            </IconButton>
            <IconButton aria-label="Redo">
              <DemoIcon name="redo" />
            </IconButton>
            <IconButton aria-label="Delete" variant="danger">
              <DemoIcon name="trash" />
            </IconButton>
          </div>
        </DemoScene>
      </LabSection>

      <LabSection
        description="A persistent on/off action. Its contract is the pressed state, so every appearance is shown as an Off and On pair."
        title="ToggleButton"
      >
        <MatrixScene
          label="State matrix"
          matrix="toggle-state"
          note="Off and On stay distinguishable in all fifteen appearances."
          renderCell={(variant, fill) => (
            <div className="slotted-demo-row" key={variant}>
              <ToggleButton fill={fill} pressed={false} variant={variant}>
                Off
              </ToggleButton>
              <ToggleButton fill={fill} pressed variant={variant}>
                On
              </ToggleButton>
            </div>
          )}
        />
      </LabSection>

      <LabSection
        columns="3"
        description="Grouped actions share one seam system across all four components."
        title="Composition"
      >
        <DemoScene
          label="Formatting toolbar"
          note="Independent toggles keep their pressed state inside a group."
        >
          <ButtonGroup aria-label="Text formatting">
            <ToggleButton leading={<DemoIcon name="bold" />} pressed>
              Bold
            </ToggleButton>
            <ToggleButton leading={<DemoIcon name="italic" />}>Italic</ToggleButton>
            <ToggleButton leading={<DemoIcon name="underline" />}>Underline</ToggleButton>
          </ButtonGroup>
        </DemoScene>
        <DemoScene label="Editing history" note="A compact icon-only toolbar with one seam system.">
          <ButtonGroup aria-label="Editing history">
            <IconButton aria-label="Undo" fill="outline" variant="secondary">
              <DemoIcon name="undo" />
            </IconButton>
            <IconButton aria-label="Redo" fill="outline" variant="secondary">
              <DemoIcon name="redo" />
            </IconButton>
            <IconButton aria-label="Delete" fill="outline" variant="secondary">
              <DemoIcon name="trash" />
            </IconButton>
          </ButtonGroup>
        </DemoScene>
        <DemoScene label="Split action" note="One primary action and its related options.">
          <ButtonGroup aria-label="Publish actions" className="slotted-split-action">
            <Button fill="solid" leading={<DemoIcon name="save" />} size="md" variant="accent">
              Publish
            </Button>
            <IconButton aria-label="More publish options" fill="solid" size="md" variant="accent">
              <DemoIcon name="chevron-down" />
            </IconButton>
          </ButtonGroup>
        </DemoScene>
      </LabSection>
    </main>
  ),
};

export const Themes: Story = {
  parameters: scenario('themes'),
  render: () => (
    <div className="slotted-demo-grid">
      {(['light', 'dark'] as const).map((scheme) => (
        <section className="slotted-demo-scene" key={scheme}>
          <header className="slotted-demo-scene__header">
            <span className="slotted-demo-scene__label">
              {scheme.charAt(0).toUpperCase() + scheme.slice(1)} scheme
            </span>
            <span className="slotted-demo-scene__note">The same semantic contract.</span>
          </header>
          <div className="slotted-demo-stage" data-slotted-scheme={scheme}>
            <div className="slotted-demo-row">
              <Button leading={<DemoIcon name="save" />}>Save draft</Button>
              <Button variant="secondary">Explore</Button>
              <IconButton aria-label="Add item" fill="outline" variant="secondary">
                <DemoIcon name="plus" />
              </IconButton>
            </div>
          </div>
        </section>
      ))}
    </div>
  ),
};

export const Densities: Story = {
  parameters: scenario('densities'),
  render: () => (
    <div className="slotted-demo-grid">
      {(['comfortable', 'compact'] as const).map((density) => (
        <section className="slotted-demo-scene" data-slotted-density={density} key={density}>
          <header className="slotted-demo-scene__header">
            <span className="slotted-demo-scene__label">
              {density.charAt(0).toUpperCase() + density.slice(1)}
            </span>
            <span className="slotted-demo-scene__note">Spacing changes, semantics do not.</span>
          </header>
          <div className="slotted-demo-stage">
            <div className="slotted-demo-row">
              <Button leading={<DemoIcon name="save" />}>Save</Button>
              <Button fill="outline" variant="secondary">
                Cancel
              </Button>
            </div>
          </div>
        </section>
      ))}
    </div>
  ),
};
