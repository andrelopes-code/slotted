import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Folder, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';

import { Badge } from '../badge';
import { Button } from '../button';
import { Checkbox } from '../checkbox';
import { Icon } from '../icon';
import { List } from '../list';
import { Skeleton } from '../skeleton';
import { Text } from '../typography';
import { ListItem } from './list-item';
import { ListItemButton, ListItemContent, ListItemLink } from './list-item-content';
import { ListItemDefaultsProvider } from './list-item-defaults';
import {
  ListItemActions,
  ListItemBody,
  ListItemDescription,
  ListItemEnd,
  ListItemLabel,
  ListItemStart,
} from './list-item-parts';
import { REACT_LIST_ITEM_DOCS, REACT_LIST_ITEM_TOKENS } from './list-item.docs';

const FolderGlyph = () => <Folder aria-hidden="true" focusable="false" />;

const TrashGlyph = () => <Trash2 aria-hidden="true" focusable="false" />;

const Scene = ({ children, label, note }: { children: ReactNode; label: string; note: string }) => (
  <section className="slotted-demo-scene">
    <header className="slotted-demo-scene__header">
      <span className="slotted-demo-scene__label">{label}</span>
      <span className="slotted-demo-scene__note">{note}</span>
    </header>
    <div className="slotted-demo-stage" data-layout="block">
      {children}
    </div>
  </section>
);

const Set = ({ children, label }: { children: ReactNode; label: string }) => (
  <List aria-label={label} variant="ruled">
    {children}
  </List>
);

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_LIST_ITEM_DOCS.listItem.scenes, {
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

const meta = {
  title: 'Components/List Item',
  component: ListItem,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'List Item',
        description:
          'One row of a List: a leading visual, a title with its lines, trailing metadata, and independent targets beside the box rather than inside it.',
        framework: 'React',
        ...REACT_LIST_ITEM_DOCS.listItem,
        tokens: REACT_LIST_ITEM_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof ListItem>;

export default meta;
type Story = StoryObj<typeof meta>;

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
  render: (args) => (
    <Set label="Folders">
      <ListItem {...args}>
        <ListItemLink href="#photos">
          <ListItemStart>
            <Icon>
              <FolderGlyph />
            </Icon>
          </ListItemStart>
          <ListItemBody>
            <ListItemLabel>Photos</ListItemLabel>
            <ListItemDescription>128 files · 2.4 GB</ListItemDescription>
          </ListItemBody>
          <ListItemEnd>Yesterday</ListItemEnd>
        </ListItemLink>
        <ListItemActions>
          <Button aria-label="Remove Photos" size="sm" variant="ghost">
            <Icon>
              <TrashGlyph />
            </Icon>
          </Button>
        </ListItemActions>
      </ListItem>
    </Set>
  ),
};

export const ContentElements: Story = {
  parameters: scenario('content-elements'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="Three boxes, three accessibility trees"
        note="A static row answers no pointer state because it promises no interaction. The button row is a real button and the link row a real anchor, so Enter, Space and a modified click are the platform's."
      >
        <Set label="Content elements">
          <ListItem>
            <ListItemContent>
              <ListItemBody>
                <ListItemLabel>A row that is read</ListItemLabel>
              </ListItemBody>
              <ListItemEnd>
                <Text size="xs" tone="muted">
                  ListItemContent
                </Text>
              </ListItemEnd>
            </ListItemContent>
          </ListItem>
          <ListItem>
            <ListItemButton>
              <ListItemBody>
                <ListItemLabel>A row that is one command</ListItemLabel>
              </ListItemBody>
              <ListItemEnd>
                <Text size="xs" tone="muted">
                  ListItemButton
                </Text>
              </ListItemEnd>
            </ListItemButton>
          </ListItem>
          <ListItem>
            <ListItemLink href="#destination">
              <ListItemBody>
                <ListItemLabel>A row that is one destination</ListItemLabel>
              </ListItemBody>
              <ListItemEnd>
                <Text size="xs" tone="muted">
                  ListItemLink
                </Text>
              </ListItemEnd>
            </ListItemLink>
          </ListItem>
        </Set>
      </Scene>
    </div>
  ),
};

export const Anatomy: Story = {
  parameters: scenario('anatomy'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="Every part"
        note="Leading visual, title, the lines under it, trailing metadata, and the independent target beside the box."
      >
        <Set label="Every part">
          <ListItem>
            <ListItemLink href="#photos">
              <ListItemStart>
                <Icon>
                  <FolderGlyph />
                </Icon>
              </ListItemStart>
              <ListItemBody>
                <ListItemLabel>Photos</ListItemLabel>
                <ListItemDescription>128 files · 2.4 GB</ListItemDescription>
              </ListItemBody>
              <ListItemEnd>Yesterday</ListItemEnd>
            </ListItemLink>
            <ListItemActions>
              <Button aria-label="Remove Photos" size="sm" variant="ghost">
                <Icon>
                  <TrashGlyph />
                </Icon>
              </Button>
            </ListItemActions>
          </ListItem>
        </Set>
      </Scene>
      <Scene
        label="A title alone"
        note="Every part but the box is optional, and an absent one leaves no column behind: each gap is a margin on the part rather than a track on the grid."
      >
        <Set label="A title alone">
          <ListItem>
            <ListItemContent>
              <ListItemBody>
                <ListItemLabel>Photos</ListItemLabel>
              </ListItemBody>
            </ListItemContent>
          </ListItem>
        </Set>
      </Scene>
    </div>
  ),
};

export const Alignment: Story = {
  parameters: scenario('alignment'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="center"
        note="Right while the block is one line, and wrong as soon as it is three: the mark floats in the middle of a paragraph it is meant to introduce."
      >
        <Set label="Centerd">
          <ListItem align="center">
            <ListItemContent>
              <ListItemStart>
                <Icon>
                  <FolderGlyph />
                </Icon>
              </ListItemStart>
              <ListItemBody>
                <ListItemLabel>Photos</ListItemLabel>
                <ListItemDescription>
                  The description runs to a second and a third line, which is where the difference
                  between the two values shows.
                </ListItemDescription>
              </ListItemBody>
              <ListItemEnd>14:02</ListItemEnd>
            </ListItemContent>
          </ListItem>
        </Set>
      </Scene>
      <Scene
        label="start"
        note="The leading visual and the metadata return to the title's own line, so a row of three lines reads from one corner. Angular Material derives this from counting the lines; a translated string can change that count."
      >
        <Set label="Aligned to the start">
          <ListItem align="start">
            <ListItemContent>
              <ListItemStart>
                <Icon>
                  <FolderGlyph />
                </Icon>
              </ListItemStart>
              <ListItemBody>
                <ListItemLabel>Photos</ListItemLabel>
                <ListItemDescription>
                  The description runs to a second and a third line, which is where the difference
                  between the two values shows.
                </ListItemDescription>
              </ListItemBody>
              <ListItemEnd>14:02</ListItemEnd>
            </ListItemContent>
          </ListItem>
        </Set>
      </Scene>
    </div>
  ),
};

export const Tone: Story = {
  parameters: scenario('tone'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="Five tones, on the rows that mean them"
        note="A tone moves the ink, the wash under the pointer and the ground of a selected row, and never fills a resting row: forty rows each filled with a tone is a list nobody can read. Primer ships danger alone and hides the rest behind a boolean."
      >
        <Set label="Tones">
          <ListItem tone="secondary">
            <ListItemButton>
              <ListItemBody>
                <ListItemLabel>Rename workspace</ListItemLabel>
              </ListItemBody>
            </ListItemButton>
          </ListItem>
          <ListItem tone="accent">
            <ListItemButton>
              <ListItemBody>
                <ListItemLabel>Invite a collaborator</ListItemLabel>
              </ListItemBody>
            </ListItemButton>
          </ListItem>
          <ListItem tone="success">
            <ListItemButton>
              <ListItemBody>
                <ListItemLabel>Publish the changes</ListItemLabel>
              </ListItemBody>
            </ListItemButton>
          </ListItem>
          <ListItem tone="warning">
            <ListItemButton>
              <ListItemBody>
                <ListItemLabel>Revoke every session</ListItemLabel>
              </ListItemBody>
            </ListItemButton>
          </ListItem>
          <ListItem tone="danger">
            <ListItemButton>
              <ListItemBody>
                <ListItemLabel>Delete the workspace</ListItemLabel>
              </ListItemBody>
            </ListItemButton>
          </ListItem>
        </Set>
      </Scene>
    </div>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="Every state the row paints"
        note="Selection is the accent ground, the accent ink and a one-pixel edge together, because every tone surface is white in the high-contrast scheme. Current is the neutral ground with its own edge, so a row can be both at once and the selection is what shows. Hover the operable rows and Tab through them to see the rest."
      >
        <Set label="States">
          <ListItem>
            <ListItemButton>
              <ListItemBody>
                <ListItemLabel>Default</ListItemLabel>
              </ListItemBody>
            </ListItemButton>
          </ListItem>
          <ListItem selected>
            <ListItemContent>
              <ListItemStart>
                <Checkbox aria-label="Select Selected" defaultChecked />
              </ListItemStart>
              <ListItemBody>
                <ListItemLabel>Selected — painted here, announced by the Checkbox</ListItemLabel>
              </ListItemBody>
            </ListItemContent>
          </ListItem>
          <ListItem current="page">
            <ListItemLink href="#current">
              <ListItemBody>
                <ListItemLabel>Current — the one state a listitem may announce</ListItemLabel>
              </ListItemBody>
            </ListItemLink>
          </ListItem>
          <ListItem current="page" selected>
            <ListItemLink href="#both">
              <ListItemBody>
                <ListItemLabel>Selected and current, on two channels</ListItemLabel>
              </ListItemBody>
            </ListItemLink>
          </ListItem>
          <ListItem loading>
            <ListItemButton>
              <ListItemBody>
                <ListItemLabel>Loading — the command cannot run twice</ListItemLabel>
              </ListItemBody>
              <ListItemEnd>
                <Skeleton inlineSize="3rem" />
              </ListItemEnd>
            </ListItemButton>
          </ListItem>
          <ListItem disabled>
            <ListItemButton>
              <ListItemBody>
                <ListItemLabel>Disabled</ListItemLabel>
                <ListItemDescription>Unavailable while the index rebuilds</ListItemDescription>
              </ListItemBody>
            </ListItemButton>
          </ListItem>
        </Set>
      </Scene>
    </div>
  ),
};

export const Actions: Story = {
  parameters: scenario('actions'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="A row that navigates and also deletes"
        note="The two targets are siblings, so the row hit area stops before the button. Interactive content may not nest inside an anchor, and every surveyed implementation lets a consumer nest it anyway."
      >
        <Set label="Folders">
          <ListItem>
            <ListItemLink href="#photos">
              <ListItemBody>
                <ListItemLabel>Photos</ListItemLabel>
                <ListItemDescription>128 files</ListItemDescription>
              </ListItemBody>
              <ListItemEnd>
                <Badge tone="accent">3</Badge>
              </ListItemEnd>
            </ListItemLink>
            <ListItemActions>
              <Button aria-label="Remove Photos" size="sm" variant="ghost">
                <Icon>
                  <TrashGlyph />
                </Icon>
              </Button>
            </ListItemActions>
          </ListItem>
        </Set>
      </Scene>
      <Scene
        label="A disabled row, and a control that is not"
        note="A disabled row refuses its own box and nothing else. The control beside it is the page's own, and only the control can refuse its own interaction — the rule Card states for the same shape."
      >
        <Set label="Folders">
          <ListItem disabled>
            <ListItemLink href="#exports">
              <ListItemBody>
                <ListItemLabel>Exports</ListItemLabel>
                <ListItemDescription>Unavailable while the index rebuilds</ListItemDescription>
              </ListItemBody>
            </ListItemLink>
            <ListItemActions>
              <Button aria-label="Remove Exports" size="sm" variant="ghost">
                <Icon>
                  <TrashGlyph />
                </Icon>
              </Button>
            </ListItemActions>
          </ListItem>
        </Set>
      </Scene>
    </div>
  ),
};

export const Reflow: Story = {
  parameters: scenario('reflow'),
  render: () => (
    <div className="slotted-demo-grid" data-columns="2">
      <Scene
        label="Wide enough for one line"
        note="The metadata sits at the end of the row, in the column the title gives way to."
      >
        <Set label="Wide">
          <ListItem>
            <ListItemLink href="#report">
              <ListItemBody>
                <ListItemLabel>Quarterly report, second revision</ListItemLabel>
                <ListItemDescription>Ada Lovelace</ListItemDescription>
              </ListItemBody>
              <ListItemEnd>14:02</ListItemEnd>
            </ListItemLink>
          </ListItem>
        </Set>
      </Scene>
      <Scene
        label="Below 22rem"
        note="The row answers its own inline size, not the viewport: the metadata leaves the inline axis and sits under the title, and the independent targets take a line of their own. The leading visual stays — it is the row's identity, and moving it says nothing."
      >
        <div className="slotted-demo-measure">
          <Set label="Narrow">
            <ListItem>
              <ListItemLink href="#report">
                <ListItemBody>
                  <ListItemLabel>Quarterly report, second revision</ListItemLabel>
                  <ListItemDescription>Ada Lovelace</ListItemDescription>
                </ListItemBody>
                <ListItemEnd>14:02</ListItemEnd>
              </ListItemLink>
            </ListItem>
          </Set>
        </div>
      </Scene>
    </div>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="Content the family did not choose"
        note="An unbroken token breaks inside the row instead of pushing the metadata out; a translated title gives way and the timestamp does not; a title in another script keeps its own direction and leaves the row around it alone."
      >
        <Set label="Content">
          <ListItem align="start">
            <ListItemLink href="#unbroken">
              <ListItemBody>
                <ListItemLabel>
                  https://example.test/workspaces/9f2c1ab4e77d4c5f9a3b6e8d0c1f2a34/settings
                </ListItemLabel>
                <ListItemDescription>One unbroken token</ListItemDescription>
              </ListItemBody>
              <ListItemEnd>Yesterday</ListItemEnd>
            </ListItemLink>
          </ListItem>
          <ListItem align="start">
            <ListItemLink href="#translated">
              <ListItemBody>
                <ListItemLabel>
                  Notification settings for external collaborators of the workspace
                </ListItemLabel>
                <ListItemDescription>A translated string is longer</ListItemDescription>
              </ListItemBody>
              <ListItemEnd>14:02</ListItemEnd>
            </ListItemLink>
          </ListItem>
          <ListItem>
            <ListItemLink href="#arabic">
              <ListItemBody>
                <ListItemLabel>مساحة العمل المشتركة</ListItemLabel>
                <ListItemDescription>Another script, its own direction</ListItemDescription>
              </ListItemBody>
              <ListItemEnd>14:02</ListItemEnd>
            </ListItemLink>
          </ListItem>
        </Set>
      </Scene>
      <Scene
        label="truncate"
        note="The title is clipped to one line and the lines under it are clipped with it — a clipped title over four wrapped lines is a row that gave up on one measure and not the other. The whole string stays in the document."
      >
        <Set label="Truncated">
          <ListItem truncate>
            <ListItemLink href="#truncate">
              <ListItemBody>
                <ListItemLabel>
                  A title the row cannot grow for, clipped rather than wrapped, with every word of
                  it still readable to assistive technology.
                </ListItemLabel>
                <ListItemDescription>
                  The description is clipped with it, because two measures in one row read as a
                  mistake.
                </ListItemDescription>
              </ListItemBody>
              <ListItemEnd>14:02</ListItemEnd>
            </ListItemLink>
          </ListItem>
        </Set>
      </Scene>
    </div>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="An inbox, built from the families beside it"
        note="Checkbox announces the selection the row paints, Badge carries the count, Button is the independent target. The rows are aligned to the start, so the chooser shares a line with the subject rather than floating between it and the sender."
      >
        <Set label="Inbox">
          <ListItem align="start" selected>
            <ListItemContent>
              <ListItemStart>
                <Checkbox aria-label="Select Quarterly report" defaultChecked />
              </ListItemStart>
              <ListItemBody>
                <ListItemLabel>Quarterly report</ListItemLabel>
                <ListItemDescription>Ada Lovelace · 14:02</ListItemDescription>
              </ListItemBody>
              <ListItemEnd>
                <Badge tone="accent">3</Badge>
              </ListItemEnd>
            </ListItemContent>
            <ListItemActions>
              <Button aria-label="Remove Quarterly report" size="sm" variant="ghost">
                <Icon>
                  <TrashGlyph />
                </Icon>
              </Button>
            </ListItemActions>
          </ListItem>
          <ListItem align="start">
            <ListItemContent>
              <ListItemStart>
                <Checkbox aria-label="Select Invoice 4417" />
              </ListItemStart>
              <ListItemBody>
                <ListItemLabel>Invoice 4417</ListItemLabel>
                <ListItemDescription>Northwind Traders · Yesterday</ListItemDescription>
              </ListItemBody>
              <ListItemEnd>
                <Badge tone="secondary">1</Badge>
              </ListItemEnd>
            </ListItemContent>
            <ListItemActions>
              <Button aria-label="Remove Invoice 4417" size="sm" variant="ghost">
                <Icon>
                  <TrashGlyph />
                </Icon>
              </Button>
            </ListItemActions>
          </ListItem>
        </Set>
      </Scene>
      <Scene
        label="One decision for every row under it"
        note="The provider sets a danger tone and a start alignment. The second row states both itself, so its ink is neutral and its leading visual sits on the middle of the block — which is the difference two lines of text are what make visible."
      >
        <ListItemDefaultsProvider align="start" tone="danger">
          <Set label="Provided">
            <ListItem>
              <ListItemContent>
                <ListItemStart>
                  <Icon>
                    <FolderGlyph />
                  </Icon>
                </ListItemStart>
                <ListItemBody>
                  <ListItemLabel>Reads the provider</ListItemLabel>
                  <ListItemDescription>
                    Danger ink, and the mark on the title's own line — where the provider put it.
                  </ListItemDescription>
                </ListItemBody>
              </ListItemContent>
            </ListItem>
            <ListItem align="center" tone="secondary">
              <ListItemContent>
                <ListItemStart>
                  <Icon>
                    <FolderGlyph />
                  </Icon>
                </ListItemStart>
                <ListItemBody>
                  <ListItemLabel>States its own tone and alignment</ListItemLabel>
                  <ListItemDescription>
                    Neutral ink, and the mark centerd on the block — because an explicit value
                    always wins.
                  </ListItemDescription>
                </ListItemBody>
              </ListItemContent>
            </ListItem>
          </Set>
        </ListItemDefaultsProvider>
      </Scene>
    </div>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <div className="slotted-demo-grid">
      <Scene
        label="Tab through the row, and past it"
        note="The family binds no key. Tab reaches the box and then the control beside it; Enter follows a link, Enter and Space activate a button. A disabled button leaves the sequence, while a disabled link stays in it and refuses the activation — which is what keeps its description reachable."
      >
        <Set label="Keyboard">
          <ListItem>
            <ListItemLink href="#first">
              <ListItemBody>
                <ListItemLabel>A destination, then its own control</ListItemLabel>
              </ListItemBody>
            </ListItemLink>
            <ListItemActions>
              <Button aria-label="Remove the first row" size="sm" variant="ghost">
                <Icon>
                  <TrashGlyph />
                </Icon>
              </Button>
            </ListItemActions>
          </ListItem>
          <ListItem>
            <ListItemButton>
              <ListItemBody>
                <ListItemLabel>A command, on Enter and on Space</ListItemLabel>
              </ListItemBody>
            </ListItemButton>
          </ListItem>
          <ListItem disabled>
            <ListItemLink href="#disabled">
              <ListItemBody>
                <ListItemLabel>A disabled destination, still reachable</ListItemLabel>
                <ListItemDescription>Unavailable while the index rebuilds</ListItemDescription>
              </ListItemBody>
            </ListItemLink>
          </ListItem>
          <ListItem disabled>
            <ListItemButton>
              <ListItemBody>
                <ListItemLabel>A disabled command, out of the sequence</ListItemLabel>
              </ListItemBody>
            </ListItemButton>
          </ListItem>
        </Set>
      </Scene>
    </div>
  ),
};
