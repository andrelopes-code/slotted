import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/notification-center/contract.json';
import { REACT_NOTIFICATION_CENTER_DOCS } from './notification-center.docs';
import * as notificationCenterStories from './notification-center.stories';

describe('NotificationCenter stories', () => {
  it('covers every required scenario', () => {
    expect(
      scenarioCoverageErrors(contract.scenarios.notificationCenter, notificationCenterStories),
    ).toEqual([]);
  });

  it('documents each public component API', () => {
    expect(
      apiMetadataErrors(
        contract.members.notificationCenter,
        REACT_NOTIFICATION_CENTER_DOCS.notificationCenter.api,
        contract.stateModel,
      ),
    ).toEqual([]);
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_NOTIFICATION_CENTER_DOCS.notificationCenter,
        framework: 'React',
        member: contract.members.notificationCenter,
        scenarioIds: contract.scenarios.notificationCenter,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_NOTIFICATION_CENTER_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
