import type { DetailPanelMessages, FamilyTranslator, PartialMessages } from '@slotted/core/i18n';
import type { ChangeRequest } from '@slotted/core/state';
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode, Ref } from 'react';

/** Every section in the flow with a heading each, or a strip with one section shown. */
export type DetailPanelLayout = 'stacked' | 'tabs';

/** Which side the aside column takes above 600 pixels; `none` when the consumer renders no aside. */
export type DetailPanelAside = 'end' | 'start' | 'none';

/** The heading rank the page-header defaults to. Stacked sections take the rank below. */
export type DetailPanelLevel = '1' | '2' | '3';

/** The page-header's size default, the sections' size, the body's gap and inset. */
export type DetailPanelSize = 'sm' | 'md' | 'lg';

/** Who scrolls: the host, or the root itself. */
export type DetailPanelScroll = 'ancestor' | 'self';

/** Under `tabs`, when a section's content exists. Inert under `stacked`. */
export type DetailPanelMount = 'active' | 'lazy' | 'eager';

/** Whether the record is there. Under either failure the body gives way to the message. */
export type DetailPanelStatus = 'ready' | 'not-found' | 'error';

/** Why the current section moved. */
export type DetailPanelSectionReason = Extract<
  ChangeRequest<string | undefined>['reason'],
  'pointer' | 'keyboard' | 'programmatic'
>;

/** The request a section change carries. */
export type DetailPanelChangeRequest = ChangeRequest<string | undefined>;

/** What an application sets once for every detail panel under it. */
export interface DetailPanelDefaults {
  aside: DetailPanelAside;
  layout: DetailPanelLayout;
  level: DetailPanelLevel;
  mount: DetailPanelMount;
  scroll: DetailPanelScroll;
  size: DetailPanelSize;
}

export interface DetailPanelDefaultsProviderProps extends Partial<DetailPanelDefaults> {
  children?: ReactNode | undefined;
}

/** What one section tells the root about itself. */
export interface DetailPanelSectionEntry {
  name: string;
  label: ReactNode;
  count?: number | undefined;
  disabled?: boolean | undefined;
  /** The element, so the registry can be sorted in document order. */
  element: HTMLElement | null;
}

/** The ids the strip's tabs family returns for one section name. */
export interface DetailPanelIdentity {
  panelId: string;
  tabId: string;
}

/** What the family hands its own parts. */
export interface DetailPanelContextValue {
  aside: DetailPanelAside;
  /** The current section, or `undefined` under `stacked` with none named. */
  current: string | undefined;
  /** Asks to move the current section. */
  select: (name: string, reason: DetailPanelSectionReason, source: unknown) => void;
  layout: DetailPanelLayout;
  level: DetailPanelLevel;
  loading: boolean;
  mount: DetailPanelMount;
  /** Whether a section has been current at least once, which is what `lazy` reads. */
  seen: (name: string) => boolean;
  /** Every registered section, in document order. */
  sections: DetailPanelSectionEntry[];
  register: (entry: DetailPanelSectionEntry) => () => void;
  /** The strip's ids for a section, once the strip has attached; `undefined` before. */
  identify: ((name: string) => DetailPanelIdentity) | undefined;
  /** The strip hands the root its `identify`, so the sections can be wired to the tabs. */
  attachIdentify: (identify: ((name: string) => DetailPanelIdentity) | undefined) => void;
  size: DetailPanelSize;
  status: DetailPanelStatus;
  /** The family's words in the language in force, with this panel's `messages` laid over them. */
  t: FamilyTranslator<DetailPanelMessages>;
}

/** What `render` receives for the root. */
export interface DetailPanelRootProps extends HTMLAttributes<HTMLElement> {
  'data-aside': DetailPanelAside;
  'data-key'?: string | undefined;
  'data-layout': DetailPanelLayout;
  'data-level': DetailPanelLevel;
  'data-loading'?: '' | undefined;
  'data-mount': DetailPanelMount;
  'data-part': string;
  'data-scroll': DetailPanelScroll;
  'data-size': DetailPanelSize;
  'data-status': DetailPanelStatus;
  'data-ui': string;
  /** The callback the root reads its element through; a substituted element attaches it. */
  ref?: Ref<HTMLElement> | undefined;
}

/** The imperative surface: the element, and the two moves a consumer cannot express declaratively. */
export interface DetailPanelHandle {
  readonly element: HTMLElement | null;
  /** Puts focus on the page-header's heading, which is where a new record starts. */
  focus(): void;
  /** Scrolls a stacked section under the chrome, or shows a tabbed one, with the reason `programmatic`. */
  scrollToSection(name: string): void;
}

export interface DetailPanelProps extends Omit<
  ComponentPropsWithRef<'article'>,
  'ref' | 'onSelect'
> {
  /** Defaults to the provider, then `end`. */
  aside?: DetailPanelAside | undefined;
  /** The section a stacked or tabbed panel starts on, read once. */
  defaultSection?: string | undefined;
  /**
   * The row that stays at the bottom: an action-bar. Rendered in the `footer`
   * part after the body, sticky at `--slotted-page-sticky-bottom`.
   */
  footer?: ReactNode | undefined;
  /** Defaults to the provider, then `stacked`. */
  layout?: DetailPanelLayout | undefined;
  /** Defaults to the provider, then `2`. */
  level?: DetailPanelLevel | undefined;
  /** The record has not arrived: `aria-busy`, and skeleton lines in every section. */
  loading?: boolean | undefined;
  /**
   * Words laid over the catalog of the language in force, key by key: the
   * aside's name (`aside`) and the root's name while loading (`loading`).
   */
  messages?: PartialMessages<DetailPanelMessages> | undefined;
  /** Defaults to the provider, then `active`. */
  mount?: DetailPanelMount | undefined;
  /** Called before the current section moves, with the request that carries the reason. */
  onSectionChange?:
    ((section: string | undefined, request: DetailPanelChangeRequest) => void) | undefined;
  /**
   * The identity of the record on screen. When it changes while focus is
   * inside the root, the heading takes focus and the scroller returns to
   * its start.
   */
  recordKey?: string | number | undefined;
  /** The handle: the element, `focus()` and `scrollToSection()`. */
  ref?: Ref<DetailPanelHandle> | undefined;
  /** Renders the root into another element. */
  render?: ((props: DetailPanelRootProps) => ReactNode) | undefined;
  /** Defaults to the provider, then `ancestor`. */
  scroll?: DetailPanelScroll | undefined;
  /** Present means the consumer owns the current section, for the life of the component. */
  section?: string | undefined;
  /** Defaults to the provider, then `md`. */
  size?: DetailPanelSize | undefined;
  /** Defaults to `ready`. */
  status?: DetailPanelStatus | undefined;
}

/** What `render` receives for a plain part. */
export interface DetailPanelPartProps extends HTMLAttributes<HTMLElement> {
  'data-part': string;
}

export interface DetailPanelBodyProps extends ComponentPropsWithRef<'div'> {
  /** An alert about the record, rendered in the `banner` part above the columns. */
  banner?: ReactNode | undefined;
  /** The metadata column, rendered in the `aside` part beside the sections. */
  aside?: ReactNode | undefined;
  /** What stands in place of the columns under `status="not-found"` or `"error"`: a result-state. */
  message?: ReactNode | undefined;
  /** Renders the body into another element. */
  render?: ((props: DetailPanelPartProps) => ReactNode) | undefined;
}

/** What `render` receives for a section. */
export interface DetailPanelSectionRootProps extends HTMLAttributes<HTMLElement> {
  'aria-labelledby'?: string | undefined;
  'data-current'?: '' | undefined;
  'data-name': string;
  'data-part': string;
  hidden?: boolean | undefined;
  id?: string | undefined;
  role?: string | undefined;
  tabIndex?: number | undefined;
}

export interface DetailPanelSectionProps extends Omit<ComponentPropsWithRef<'div'>, 'title'> {
  /** The section's own controls: in the stacked heading's actions column, or in a row above a tabbed section. */
  actions?: ReactNode | undefined;
  /** Drawn in the tab, or as the stacked heading's eyebrow. */
  count?: number | undefined;
  /** Takes the tab out of the strip's sequence. Inert under `stacked`. */
  disabled?: boolean | undefined;
  /** The tab's words, and the stacked heading. */
  label: ReactNode;
  /** The value the section is named by in `section`, `defaultSection` and the URL. */
  name: string;
  /** Renders the section into another element. */
  render?: ((props: DetailPanelSectionRootProps) => ReactNode) | undefined;
}

export interface DetailPanelTabsProps {
  /** A toolbar beside the list, in the strip's actions part. */
  children?: ReactNode | undefined;
  /** The list's accessible name. */
  label: string;
}
