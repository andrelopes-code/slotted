import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/media-viewer/contract.json';
import { apiMetadataErrors, scenarioCoverageErrors } from '@slotted/storybook-workbench';
import { referencePageErrors, snippetFormatErrors } from '@slotted/storybook-workbench/testing';

import { REACT_MEDIA_VIEWER_DOCS } from './media-viewer.docs';
import * as mediaViewerStories from './media-viewer.stories';

describe('MediaViewer stories', () => {
  it('covers every required scenario', () => {
    expect(scenarioCoverageErrors(contract.scenarios.mediaViewer, mediaViewerStories)).toEqual([]);
  });

  it('documents each public component API', () => {
    expect(
      apiMetadataErrors(
        contract.members.mediaViewer,
        REACT_MEDIA_VIEWER_DOCS.mediaViewer.api,
        contract.stateModel,
      ),
    ).toEqual([]);
  });

  it('answers the reference-page contract', () => {
    expect(
      referencePageErrors({
        docs: REACT_MEDIA_VIEWER_DOCS.mediaViewer,
        framework: 'React',
        member: contract.members.mediaViewer,
        scenarioIds: contract.scenarios.mediaViewer,
      }),
    ).toEqual([]);
  });

  it('keeps curated snippets formatted', async () => {
    const snippets = Object.values(REACT_MEDIA_VIEWER_DOCS).flatMap((docs) => [
      ...docs.snippets,
      ...docs.scenes.map((scene) => scene.snippet),
    ]);
    expect(await snippetFormatErrors(snippets)).toEqual([]);
  });
});
