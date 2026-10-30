/*
 * The catalog: one entry per family, under its name in camelCase. A family
 * that writes words adds its file to `messages/` and one line to each list
 * below; the type of `SlottedMessages` then requires every locale to name it.
 */

import * as actionBarModule from './messages/action-bar';
import * as actionSheetModule from './messages/action-sheet';
import * as alertModule from './messages/alert';
import * as appShellModule from './messages/app-shell';
import * as attachmentModule from './messages/attachment';
import * as breadcrumbModule from './messages/breadcrumb';
import * as buttonModule from './messages/button';
import * as calendarModule from './messages/calendar';
import * as carouselModule from './messages/carousel';
import * as cascaderModule from './messages/cascader';
import * as chartModule from './messages/chart';
import * as codeBlockModule from './messages/code-block';
import * as colorPickerModule from './messages/color-picker';
import * as columnManagerModule from './messages/column-manager';
import * as comboboxModule from './messages/combobox';
import * as commandPaletteModule from './messages/command-palette';
import * as currencyFieldModule from './messages/currency-field';
import * as dashboardGridModule from './messages/dashboard-grid';
import * as dataGridModule from './messages/data-grid';
import * as dataListModule from './messages/data-list';
import * as dateFieldModule from './messages/date-field';
import * as datePickerModule from './messages/date-picker';
import * as dateRangePickerModule from './messages/date-range-picker';
import * as datetimeFieldModule from './messages/datetime-field';
import * as datetimePickerModule from './messages/datetime-picker';
import * as datetimeRangePickerModule from './messages/datetime-range-picker';
import * as descriptionListModule from './messages/description-list';
import * as detailPanelModule from './messages/detail-panel';
import * as dialogModule from './messages/dialog';
import * as dragModule from './messages/drag';
import * as drawerModule from './messages/drawer';
import * as entityPickerModule from './messages/entity-picker';
import * as eventCalendarModule from './messages/event-calendar';
import * as fieldModule from './messages/field';
import * as filterBarModule from './messages/filter-bar';
import * as formModule from './messages/form';
import * as fullscreenModule from './messages/fullscreen';
import * as importExportCenterModule from './messages/import-export-center';
import * as keysModule from './messages/keys';
import * as linkModule from './messages/link';
import * as loadingOverlayModule from './messages/loading-overlay';
import * as markdownModule from './messages/markdown';
import * as mediaViewerModule from './messages/media-viewer';
import * as messageModule from './messages/message';
import * as messageScrollerModule from './messages/message-scroller';
import * as multiSelectModule from './messages/multi-select';
import * as navigationMenuModule from './messages/navigation-menu';
import * as notificationCenterModule from './messages/notification-center';
import * as numberFieldModule from './messages/number-field';
import * as pageModule from './messages/page';
import * as pageHeaderModule from './messages/page-header';
import * as paginationModule from './messages/pagination';
import * as popoverModule from './messages/popover';
import * as promptComposerModule from './messages/prompt-composer';
import * as proseModule from './messages/prose';
import * as ratingModule from './messages/rating';
import * as savedViewsModule from './messages/saved-views';
import * as scrollAreaModule from './messages/scroll-area';
import * as selectModule from './messages/select';
import * as sideNavigationModule from './messages/side-navigation';
import * as skeletonModule from './messages/skeleton';
import * as sparklineModule from './messages/sparkline';
import * as statCardModule from './messages/stat-card';
import * as statusIndicatorModule from './messages/status-indicator';
import * as stepperModule from './messages/stepper';
import * as switchModule from './messages/switch';
import * as tableModule from './messages/table';
import * as tableOfContentsModule from './messages/table-of-contents';
import * as tagModule from './messages/tag';
import * as tagsInputModule from './messages/tags-input';
import * as textFieldModule from './messages/text-field';
import * as timeFieldModule from './messages/time-field';
import * as timePickerModule from './messages/time-picker';
import * as timeRangePickerModule from './messages/time-range-picker';
import * as timelineModule from './messages/timeline';
import * as toastModule from './messages/toast';
import * as toolbarModule from './messages/toolbar';
import * as topNavigationModule from './messages/top-navigation';
import * as tourModule from './messages/tour';
import * as transferModule from './messages/transfer';
import * as uploadModule from './messages/upload';
import * as wizardModule from './messages/wizard';

export type { ActionBarMessages } from './messages/action-bar';
export type { ActionSheetMessages } from './messages/action-sheet';
export type { AlertMessages } from './messages/alert';
export type { AppShellMessages } from './messages/app-shell';
export type { AttachmentMessages } from './messages/attachment';
export type { BreadcrumbMessages } from './messages/breadcrumb';
export type { ButtonMessages } from './messages/button';
export type { CalendarMessages } from './messages/calendar';
export type { CarouselMessages } from './messages/carousel';
export type { CascaderMessages } from './messages/cascader';
export type { ChartMessages } from './messages/chart';
export type { CodeBlockMessages } from './messages/code-block';
export type { ColorPickerMessages } from './messages/color-picker';
export type { ColumnManagerMessages } from './messages/column-manager';
export type { ComboboxMessages } from './messages/combobox';
export type { CommandPaletteMessages } from './messages/command-palette';
export type { CurrencyFieldMessages } from './messages/currency-field';
export type { DashboardGridMessages } from './messages/dashboard-grid';
export type { DataGridMessages } from './messages/data-grid';
export type { DataListMessages } from './messages/data-list';
export type { DateFieldMessages } from './messages/date-field';
export type { DatePickerMessages } from './messages/date-picker';
export type { DateRangePickerMessages } from './messages/date-range-picker';
export type { DatetimeFieldMessages } from './messages/datetime-field';
export type { DatetimePickerMessages } from './messages/datetime-picker';
export type { DatetimeRangePickerMessages } from './messages/datetime-range-picker';
export type { DescriptionListMessages } from './messages/description-list';
export type { DetailPanelMessages } from './messages/detail-panel';
export type { DialogMessages } from './messages/dialog';
export type { DragMessages } from './messages/drag';
export type { DrawerMessages } from './messages/drawer';
export type { EntityPickerMessages } from './messages/entity-picker';
export type { EventCalendarMessages } from './messages/event-calendar';
export type { FieldMessages } from './messages/field';
export type { FilterBarMessages } from './messages/filter-bar';
export type { FormMessages } from './messages/form';
export type { FullscreenMessages } from './messages/fullscreen';
export type { ImportExportCenterMessages } from './messages/import-export-center';
export type { KeysMessages } from './messages/keys';
export type { LinkMessages } from './messages/link';
export type { LoadingOverlayMessages } from './messages/loading-overlay';
export type { MarkdownMessages } from './messages/markdown';
export type { MediaViewerMessages } from './messages/media-viewer';
export type { MessageMessages } from './messages/message';
export type { MessageScrollerMessages } from './messages/message-scroller';
export type { MultiSelectMessages } from './messages/multi-select';
export type { NavigationMenuMessages } from './messages/navigation-menu';
export type { NotificationCenterMessages } from './messages/notification-center';
export type { NumberFieldMessages } from './messages/number-field';
export type { PageMessages } from './messages/page';
export type { PageHeaderMessages } from './messages/page-header';
export type { PaginationMessages } from './messages/pagination';
export type { PopoverMessages } from './messages/popover';
export type { PromptComposerMessages } from './messages/prompt-composer';
export type { ProseMessages } from './messages/prose';
export type { RatingMessages } from './messages/rating';
export type { SavedViewsMessages } from './messages/saved-views';
export type { ScrollAreaMessages } from './messages/scroll-area';
export type { SelectMessages } from './messages/select';
export type { SideNavigationMessages } from './messages/side-navigation';
export type { SkeletonMessages } from './messages/skeleton';
export type { SparklineMessages } from './messages/sparkline';
export type { StatCardMessages } from './messages/stat-card';
export type { StatusIndicatorMessages } from './messages/status-indicator';
export type { StepperMessages } from './messages/stepper';
export type { SwitchMessages } from './messages/switch';
export type { TableMessages } from './messages/table';
export type { TableOfContentsMessages } from './messages/table-of-contents';
export type { TagMessages } from './messages/tag';
export type { TagsInputMessages } from './messages/tags-input';
export type { TextFieldMessages } from './messages/text-field';
export type { TimeFieldMessages } from './messages/time-field';
export type { TimePickerMessages } from './messages/time-picker';
export type { TimeRangePickerMessages } from './messages/time-range-picker';
export type { TimelineMessages } from './messages/timeline';
export type { ToastMessages } from './messages/toast';
export type { ToolbarMessages } from './messages/toolbar';
export type { TopNavigationMessages } from './messages/top-navigation';
export type { TourMessages } from './messages/tour';
export type { TransferMessages } from './messages/transfer';
export type { UploadMessages } from './messages/upload';
export type { WizardMessages } from './messages/wizard';

export { actionBarMessages } from './messages/action-bar';
export { actionSheetMessages } from './messages/action-sheet';
export { alertMessages } from './messages/alert';
export { appShellMessages } from './messages/app-shell';
export { attachmentMessages } from './messages/attachment';
export { breadcrumbMessages } from './messages/breadcrumb';
export { buttonMessages } from './messages/button';
export { calendarMessages } from './messages/calendar';
export { carouselMessages } from './messages/carousel';
export { cascaderMessages } from './messages/cascader';
export { chartMessages } from './messages/chart';
export { codeBlockMessages } from './messages/code-block';
export { colorPickerMessages } from './messages/color-picker';
export { columnManagerMessages } from './messages/column-manager';
export { comboboxMessages } from './messages/combobox';
export { commandPaletteMessages } from './messages/command-palette';
export { currencyFieldMessages } from './messages/currency-field';
export { dashboardGridMessages } from './messages/dashboard-grid';
export { dataGridMessages } from './messages/data-grid';
export { dataListMessages } from './messages/data-list';
export { dateFieldMessages } from './messages/date-field';
export { datePickerMessages } from './messages/date-picker';
export { dateRangePickerMessages } from './messages/date-range-picker';
export { datetimeFieldMessages } from './messages/datetime-field';
export { datetimePickerMessages } from './messages/datetime-picker';
export { datetimeRangePickerMessages } from './messages/datetime-range-picker';
export { descriptionListMessages } from './messages/description-list';
export { detailPanelMessages } from './messages/detail-panel';
export { dialogMessages } from './messages/dialog';
export { dragMessages } from './messages/drag';
export { drawerMessages } from './messages/drawer';
export { entityPickerMessages } from './messages/entity-picker';
export { eventCalendarMessages } from './messages/event-calendar';
export { fieldMessages } from './messages/field';
export { filterBarMessages } from './messages/filter-bar';
export { formMessages } from './messages/form';
export { fullscreenMessages } from './messages/fullscreen';
export { importExportCenterMessages } from './messages/import-export-center';
export { keysMessages } from './messages/keys';
export { linkMessages } from './messages/link';
export { loadingOverlayMessages } from './messages/loading-overlay';
export { markdownMessages } from './messages/markdown';
export { mediaViewerMessages } from './messages/media-viewer';
export { messageMessages } from './messages/message';
export { messageScrollerMessages } from './messages/message-scroller';
export { multiSelectMessages } from './messages/multi-select';
export { navigationMenuMessages } from './messages/navigation-menu';
export { notificationCenterMessages } from './messages/notification-center';
export { numberFieldMessages } from './messages/number-field';
export { pageMessages } from './messages/page';
export { pageHeaderMessages } from './messages/page-header';
export { paginationMessages } from './messages/pagination';
export { popoverMessages } from './messages/popover';
export { promptComposerMessages } from './messages/prompt-composer';
export { proseMessages } from './messages/prose';
export { ratingMessages } from './messages/rating';
export { savedViewsMessages } from './messages/saved-views';
export { scrollAreaMessages } from './messages/scroll-area';
export { selectMessages } from './messages/select';
export { sideNavigationMessages } from './messages/side-navigation';
export { skeletonMessages } from './messages/skeleton';
export { sparklineMessages } from './messages/sparkline';
export { statCardMessages } from './messages/stat-card';
export { statusIndicatorMessages } from './messages/status-indicator';
export { stepperMessages } from './messages/stepper';
export { switchMessages } from './messages/switch';
export { tableMessages } from './messages/table';
export { tableOfContentsMessages } from './messages/table-of-contents';
export { tagMessages } from './messages/tag';
export { tagsInputMessages } from './messages/tags-input';
export { textFieldMessages } from './messages/text-field';
export { timeFieldMessages } from './messages/time-field';
export { timePickerMessages } from './messages/time-picker';
export { timeRangePickerMessages } from './messages/time-range-picker';
export { timelineMessages } from './messages/timeline';
export { toastMessages } from './messages/toast';
export { toolbarMessages } from './messages/toolbar';
export { topNavigationMessages } from './messages/top-navigation';
export { tourMessages } from './messages/tour';
export { transferMessages } from './messages/transfer';
export { uploadMessages } from './messages/upload';
export { wizardMessages } from './messages/wizard';

/** Every family's messages, by catalog name. */
export interface SlottedMessages {
  readonly actionBar: actionBarModule.ActionBarMessages;
  readonly actionSheet: actionSheetModule.ActionSheetMessages;
  readonly alert: alertModule.AlertMessages;
  readonly appShell: appShellModule.AppShellMessages;
  readonly attachment: attachmentModule.AttachmentMessages;
  readonly breadcrumb: breadcrumbModule.BreadcrumbMessages;
  readonly button: buttonModule.ButtonMessages;
  readonly calendar: calendarModule.CalendarMessages;
  readonly carousel: carouselModule.CarouselMessages;
  readonly cascader: cascaderModule.CascaderMessages;
  readonly chart: chartModule.ChartMessages;
  readonly codeBlock: codeBlockModule.CodeBlockMessages;
  readonly colorPicker: colorPickerModule.ColorPickerMessages;
  readonly columnManager: columnManagerModule.ColumnManagerMessages;
  readonly combobox: comboboxModule.ComboboxMessages;
  readonly commandPalette: commandPaletteModule.CommandPaletteMessages;
  readonly currencyField: currencyFieldModule.CurrencyFieldMessages;
  readonly dashboardGrid: dashboardGridModule.DashboardGridMessages;
  readonly dataGrid: dataGridModule.DataGridMessages;
  readonly dataList: dataListModule.DataListMessages;
  readonly dateField: dateFieldModule.DateFieldMessages;
  readonly datePicker: datePickerModule.DatePickerMessages;
  readonly dateRangePicker: dateRangePickerModule.DateRangePickerMessages;
  readonly datetimeField: datetimeFieldModule.DatetimeFieldMessages;
  readonly datetimePicker: datetimePickerModule.DatetimePickerMessages;
  readonly datetimeRangePicker: datetimeRangePickerModule.DatetimeRangePickerMessages;
  readonly descriptionList: descriptionListModule.DescriptionListMessages;
  readonly detailPanel: detailPanelModule.DetailPanelMessages;
  readonly dialog: dialogModule.DialogMessages;
  readonly drag: dragModule.DragMessages;
  readonly drawer: drawerModule.DrawerMessages;
  readonly entityPicker: entityPickerModule.EntityPickerMessages;
  readonly eventCalendar: eventCalendarModule.EventCalendarMessages;
  readonly field: fieldModule.FieldMessages;
  readonly filterBar: filterBarModule.FilterBarMessages;
  readonly form: formModule.FormMessages;
  readonly fullscreen: fullscreenModule.FullscreenMessages;
  readonly importExportCenter: importExportCenterModule.ImportExportCenterMessages;
  readonly keys: keysModule.KeysMessages;
  readonly link: linkModule.LinkMessages;
  readonly loadingOverlay: loadingOverlayModule.LoadingOverlayMessages;
  readonly markdown: markdownModule.MarkdownMessages;
  readonly mediaViewer: mediaViewerModule.MediaViewerMessages;
  readonly message: messageModule.MessageMessages;
  readonly messageScroller: messageScrollerModule.MessageScrollerMessages;
  readonly multiSelect: multiSelectModule.MultiSelectMessages;
  readonly navigationMenu: navigationMenuModule.NavigationMenuMessages;
  readonly notificationCenter: notificationCenterModule.NotificationCenterMessages;
  readonly numberField: numberFieldModule.NumberFieldMessages;
  readonly page: pageModule.PageMessages;
  readonly pageHeader: pageHeaderModule.PageHeaderMessages;
  readonly pagination: paginationModule.PaginationMessages;
  readonly popover: popoverModule.PopoverMessages;
  readonly promptComposer: promptComposerModule.PromptComposerMessages;
  readonly prose: proseModule.ProseMessages;
  readonly rating: ratingModule.RatingMessages;
  readonly savedViews: savedViewsModule.SavedViewsMessages;
  readonly scrollArea: scrollAreaModule.ScrollAreaMessages;
  readonly select: selectModule.SelectMessages;
  readonly sideNavigation: sideNavigationModule.SideNavigationMessages;
  readonly skeleton: skeletonModule.SkeletonMessages;
  readonly sparkline: sparklineModule.SparklineMessages;
  readonly statCard: statCardModule.StatCardMessages;
  readonly statusIndicator: statusIndicatorModule.StatusIndicatorMessages;
  readonly stepper: stepperModule.StepperMessages;
  readonly switch: switchModule.SwitchMessages;
  readonly table: tableModule.TableMessages;
  readonly tableOfContents: tableOfContentsModule.TableOfContentsMessages;
  readonly tag: tagModule.TagMessages;
  readonly tagsInput: tagsInputModule.TagsInputMessages;
  readonly textField: textFieldModule.TextFieldMessages;
  readonly timeField: timeFieldModule.TimeFieldMessages;
  readonly timePicker: timePickerModule.TimePickerMessages;
  readonly timeRangePicker: timeRangePickerModule.TimeRangePickerMessages;
  readonly timeline: timelineModule.TimelineMessages;
  readonly toast: toastModule.ToastMessages;
  readonly toolbar: toolbarModule.ToolbarMessages;
  readonly topNavigation: topNavigationModule.TopNavigationMessages;
  readonly tour: tourModule.TourMessages;
  readonly transfer: transferModule.TransferMessages;
  readonly upload: uploadModule.UploadMessages;
  readonly wizard: wizardModule.WizardMessages;
}

/** The base catalog, American English: complete by construction, and where every lookup ends. */
export const EN_US: SlottedMessages = {
  actionBar: actionBarModule.en,
  actionSheet: actionSheetModule.en,
  alert: alertModule.en,
  appShell: appShellModule.en,
  attachment: attachmentModule.en,
  breadcrumb: breadcrumbModule.en,
  button: buttonModule.en,
  calendar: calendarModule.en,
  carousel: carouselModule.en,
  cascader: cascaderModule.en,
  chart: chartModule.en,
  codeBlock: codeBlockModule.en,
  colorPicker: colorPickerModule.en,
  columnManager: columnManagerModule.en,
  combobox: comboboxModule.en,
  commandPalette: commandPaletteModule.en,
  currencyField: currencyFieldModule.en,
  dashboardGrid: dashboardGridModule.en,
  dataGrid: dataGridModule.en,
  dataList: dataListModule.en,
  dateField: dateFieldModule.en,
  datePicker: datePickerModule.en,
  dateRangePicker: dateRangePickerModule.en,
  datetimeField: datetimeFieldModule.en,
  datetimePicker: datetimePickerModule.en,
  datetimeRangePicker: datetimeRangePickerModule.en,
  descriptionList: descriptionListModule.en,
  detailPanel: detailPanelModule.en,
  dialog: dialogModule.en,
  drag: dragModule.en,
  drawer: drawerModule.en,
  entityPicker: entityPickerModule.en,
  eventCalendar: eventCalendarModule.en,
  field: fieldModule.en,
  filterBar: filterBarModule.en,
  form: formModule.en,
  fullscreen: fullscreenModule.en,
  importExportCenter: importExportCenterModule.en,
  keys: keysModule.en,
  link: linkModule.en,
  loadingOverlay: loadingOverlayModule.en,
  markdown: markdownModule.en,
  mediaViewer: mediaViewerModule.en,
  message: messageModule.en,
  messageScroller: messageScrollerModule.en,
  multiSelect: multiSelectModule.en,
  navigationMenu: navigationMenuModule.en,
  notificationCenter: notificationCenterModule.en,
  numberField: numberFieldModule.en,
  page: pageModule.en,
  pageHeader: pageHeaderModule.en,
  pagination: paginationModule.en,
  popover: popoverModule.en,
  promptComposer: promptComposerModule.en,
  prose: proseModule.en,
  rating: ratingModule.en,
  savedViews: savedViewsModule.en,
  scrollArea: scrollAreaModule.en,
  select: selectModule.en,
  sideNavigation: sideNavigationModule.en,
  skeleton: skeletonModule.en,
  sparkline: sparklineModule.en,
  statCard: statCardModule.en,
  statusIndicator: statusIndicatorModule.en,
  stepper: stepperModule.en,
  switch: switchModule.en,
  table: tableModule.en,
  tableOfContents: tableOfContentsModule.en,
  tag: tagModule.en,
  tagsInput: tagsInputModule.en,
  textField: textFieldModule.en,
  timeField: timeFieldModule.en,
  timePicker: timePickerModule.en,
  timeRangePicker: timeRangePickerModule.en,
  timeline: timelineModule.en,
  toast: toastModule.en,
  toolbar: toolbarModule.en,
  topNavigation: topNavigationModule.en,
  tour: tourModule.en,
  transfer: transferModule.en,
  upload: uploadModule.en,
  wizard: wizardModule.en,
};
