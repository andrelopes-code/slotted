/* The engine's floor: the core and the SVG renderer. Every chart pays it once. */
export { init, use } from 'echarts/core';
import { SVGRenderer } from 'echarts/renderers';

export const extensions = [SVGRenderer];
