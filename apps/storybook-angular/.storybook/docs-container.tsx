import { DocsContainer, type DocsContainerProps } from '@storybook/addon-docs/blocks';
import { createElement, useEffect, useState, type PropsWithChildren } from 'react';

import {
  applyRootScheme,
  getStorybookTheme,
  normalizeScheme,
  subscribeToScheme,
  type SlottedScheme,
} from './theme';

const getInitialScheme = (context: DocsContainerProps['context']): SlottedScheme => {
  const [story] = context.componentStories();

  return normalizeScheme(story ? context.getStoryContext(story)['globals']['scheme'] : undefined);
};

export const SlottedDocsContainer = ({
  children,
  context,
}: PropsWithChildren<DocsContainerProps>) => {
  const initialScheme = getInitialScheme(context);
  const [scheme, setScheme] = useState(initialScheme);

  useEffect(() => {
    return subscribeToScheme(context.channel, initialScheme, (nextScheme) => {
      applyRootScheme(document.documentElement, nextScheme);
      setScheme(nextScheme);
    });
  }, [context.channel, initialScheme]);

  return createElement(DocsContainer, { context, theme: getStorybookTheme(scheme) }, children);
};
