import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/dashboard-grid/contract.json';
import { ANGULAR_DASHBOARD_GRID_DOCS } from './dashboard-grid.docs';
import * as dashboardGridStories from './dashboard-grid.stories';

const docs = ANGULAR_DASHBOARD_GRID_DOCS['dashboard-grid'];
const member = contract.members['dashboard-grid'];
const scenarios = contract.scenarios['dashboard-grid'];

describe('SlDashboardGrid stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(scenarios, dashboardGridStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    expect(apiMetadataErrors(member, docs.api, contract.stateModel)).toEqual([]);
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs,
        framework: 'Angular',
        member,
        scenarioIds: scenarios,
        stateModel: contract.stateModel,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(ANGULAR_DASHBOARD_GRID_DOCS).flatMap((entry) => [
      ...entry.snippets,
      ...entry.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
