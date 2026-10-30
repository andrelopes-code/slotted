import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/event-calendar/contract.json';
import { ANGULAR_EVENT_CALENDAR_DOCS } from './event-calendar.docs';
import * as eventCalendarStories from './event-calendar.stories';

describe('SlEventCalendar stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.eventCalendar, eventCalendarStories)).toEqual(
      [],
    );
  });

  it('documents each public component API', () => {
    expect(
      apiMetadataErrors(
        contract.members.eventCalendar,
        ANGULAR_EVENT_CALENDAR_DOCS.eventCalendar.api,
        contract.stateModel,
      ),
    ).toEqual([]);
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: ANGULAR_EVENT_CALENDAR_DOCS.eventCalendar,
        framework: 'Angular',
        member: contract.members.eventCalendar,
        scenarioIds: contract.scenarios.eventCalendar,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_EVENT_CALENDAR_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
