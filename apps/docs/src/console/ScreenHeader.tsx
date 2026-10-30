import type { ReactNode } from 'react';

import {
  PageHeader,
  PageHeaderActions,
  PageHeaderHeading,
  PageHeaderSubheading,
  PageHeaderTabs,
  PageHeaderTitle,
  PageHeaderTitleArea,
  PageHeaderTitleRow,
} from '@slotted/react/page-header';
import { Tab, TabList, Tabs } from '@slotted/react/tabs';

export interface ScreenView {
  value: string;
  label: string;
  count?: number | undefined;
}

export interface ScreenHeaderProps {
  title: string;
  /** One line under the title: what the screen covers and from where. */
  subheading: ReactNode;
  actions?: ReactNode;
  /** The screen's views, as the header's tabs (LA-04). */
  views?: readonly ScreenView[] | undefined;
  view?: string | undefined;
  onView?: ((value: string) => void) | undefined;
}

/** The top of every console screen: the title, its line, the actions and the views. */
export function ScreenHeader({
  title,
  subheading,
  actions,
  views,
  view,
  onView,
}: ScreenHeaderProps) {
  return (
    <PageHeader level="1" size="sm">
      <PageHeaderTitleArea>
        <PageHeaderTitleRow>
          <PageHeaderTitle>
            <PageHeaderHeading>{title}</PageHeaderHeading>
            <PageHeaderSubheading>{subheading}</PageHeaderSubheading>
          </PageHeaderTitle>
          {actions && <PageHeaderActions>{actions}</PageHeaderActions>}
        </PageHeaderTitleRow>
      </PageHeaderTitleArea>
      {views && (
        <PageHeaderTabs>
          <Tabs
            value={view}
            onValueChange={(next) => {
              if (typeof next === 'string') onView?.(next);
            }}
            size="sm"
          >
            <TabList aria-label={`${title} views`}>
              {views.map((entry) => (
                <Tab key={entry.value} value={entry.value}>
                  {entry.label}
                  {entry.count !== undefined && (
                    <span className="console-tab-count">{entry.count}</span>
                  )}
                </Tab>
              ))}
            </TabList>
          </Tabs>
        </PageHeaderTabs>
      )}
    </PageHeader>
  );
}
