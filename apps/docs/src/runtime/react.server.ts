import { createElement, type ComponentType } from 'react';
import { renderToString } from 'react-dom/server';

import { exampleIdPrefix } from './react-ids';

export function renderReact(component: ComponentType, id: string): string {
  return renderToString(createElement(component), { identifierPrefix: exampleIdPrefix(id) });
}
