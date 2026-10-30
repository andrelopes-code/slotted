import { createContext, useContext } from 'react';

import type {
  TimelineContextValue,
  TimelineItemContextValue,
  TimelineListContextValue,
} from './timeline.types';

export const TimelineContext = createContext<TimelineContextValue | undefined>(undefined);
export const TimelineListContext = createContext<TimelineListContextValue>({
  currentIndex: -1,
  loaded: 0,
});
export const TimelineItemContext = createContext<TimelineItemContextValue | undefined>(undefined);

/**
 * What the timeline around this part says, and the one imperative surface a
 * consumer cannot express as a prop: moving focus to an article of the feed.
 */
export function useTimeline(): TimelineContextValue {
  const context = useContext(TimelineContext);
  if (context === undefined) {
    throw new Error('Timeline parts must be rendered inside a Timeline.');
  }
  return context;
}

export function useTimelineList(): TimelineListContextValue {
  return useContext(TimelineListContext);
}

export function useTimelineItem(): TimelineItemContextValue | undefined {
  return useContext(TimelineItemContext);
}
