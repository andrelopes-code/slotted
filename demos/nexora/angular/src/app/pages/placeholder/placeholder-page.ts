import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  SlBreadcrumb,
  SlBreadcrumbItem,
  SlBreadcrumbLink,
  SlBreadcrumbList,
  SlBreadcrumbPage,
} from '@slotted/angular/breadcrumb';
import { SlPage, SlPageBody } from '@slotted/angular/page';
import {
  SlPageHeader,
  SlPageHeaderBreadcrumbs,
  SlPageHeaderHeading,
  SlPageHeaderNav,
  SlPageHeaderTitle,
  SlPageHeaderTitleArea,
  SlPageHeaderTitleRow,
} from '@slotted/angular/page-header';
import {
  SlResultState,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateTitle,
} from '@slotted/angular/result-state';

import { destinationFor, moduleFor } from '../../core/nav/nav.model';

/** A route that exists, with its permission and its place in the navigation, before its screen does. */
@Component({
  selector: 'app-placeholder-page',
  imports: [
    RouterLink,
    SlBreadcrumb,
    SlBreadcrumbItem,
    SlBreadcrumbLink,
    SlBreadcrumbList,
    SlBreadcrumbPage,
    SlPage,
    SlPageBody,
    SlPageHeader,
    SlPageHeaderBreadcrumbs,
    SlPageHeaderHeading,
    SlPageHeaderNav,
    SlPageHeaderTitle,
    SlPageHeaderTitleArea,
    SlPageHeaderTitleRow,
    SlResultState,
    SlResultStateContent,
    SlResultStateDescription,
    SlResultStateTitle,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div slPage>
      <header slPageHeader>
        <div slPageHeaderTitleArea>
          @if (module(); as m) {
            <div slPageHeaderNav>
              <nav slBreadcrumb slPageHeaderBreadcrumbs>
                <ol slBreadcrumbList>
                  <li slBreadcrumbItem>
                    <a slBreadcrumbLink [routerLink]="m.path">{{ m.label }}</a>
                  </li>
                  <li slBreadcrumbItem><span slBreadcrumbPage>{{ title() }}</span></li>
                </ol>
              </nav>
            </div>
          }
          <div slPageHeaderTitleRow>
            <div slPageHeaderTitle><h1 slPageHeaderHeading>{{ title() }}</h1></div>
          </div>
        </div>
      </header>
      <div slPageBody>
        <div slResultState status="empty" reach="section">
          <div slResultStateContent>
            <h2 slResultStateTitle>
              {{ creating() ? 'Creation arrives with this module' : 'This area is not built yet' }}
            </h2>
            <p slResultStateDescription>
              {{ title() }} is part of the {{ slice() }} slice. The route, its permission and its
              place in the navigation are already real.
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PlaceholderPage {
  private readonly route = inject(ActivatedRoute);
  private readonly data = toSignal(this.route.data, { initialValue: this.route.snapshot.data });
  private readonly query = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  readonly url = computed(() => this.data()['path'] as string);
  readonly title = computed(() => this.data()['title'] as string);
  readonly module = computed(() => moduleFor(this.url()));
  readonly slice = computed(
    () => this.module()?.slice ?? destinationFor(this.url())?.module.slice ?? 'a later',
  );
  readonly creating = computed(() => this.query().get('new') === '1');
}
