import { Directive } from '@angular/core';

/**
 * The summary a consumer writes instead of the family's own.
 *
 * A `TemplateRef` rather than a render function, because that is what Angular
 * has where React has a function — and it is the asymmetry
 * `docs/history/designs/2026-09-04-select-and-combobox-design.md` §11 records
 * rather than levels away. The context carries the values and the labels the
 * family could resolve, so a consumer who already holds the records does not
 * resolve them twice:
 *
 * ```html
 * <ng-template slSelectValue let-values let-labels="labels">
 *   {{ values.length }} of 40 chosen
 * </ng-template>
 * ```
 */
@Directive({ selector: '[slSelectValue]', standalone: true })
export class SlSelectValue {}
