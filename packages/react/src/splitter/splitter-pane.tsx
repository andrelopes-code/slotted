import type { SplitterPaneProps } from './splitter.types';

export function SplitterPane(props: SplitterPaneProps) {
  return <div {...props} data-part="pane" />;
}
