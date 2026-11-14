import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/meter/contract.json';
import { REACT_METER_DOCS } from './meter.docs';
import * as meterStories from './meter.stories';

describe('Meter stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.meter, meterStories)).toEqual([]);
  });

  it('documents the public component API', () => {
    expect(apiMetadataErrors(contract.members.meter, REACT_METER_DOCS.meter.api)).toEqual([]);
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_METER_DOCS.meter,
        framework: 'React',
        member: contract.members.meter,
        scenarioIds: contract.scenarios.meter,
      }),
    ).toEqual([]);
  });

  it('keeps curated React snippets formatted', async () => {
    const snippets = [
      ...REACT_METER_DOCS.meter.snippets,
      ...REACT_METER_DOCS.meter.scenes.map((scene) => scene.snippet),
    ];
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
