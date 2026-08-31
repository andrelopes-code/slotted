import type { FieldsetLegendProps } from './fieldset.types';

export function FieldsetLegend(props: FieldsetLegendProps) {
  return <legend {...props} data-part="legend" />;
}
