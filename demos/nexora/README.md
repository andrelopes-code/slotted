# Nexora

Reference application for the library: an operations product built only from
the published `@slotted/*` packages, used to calibrate the kit against a real
screen and to demonstrate it.

| Directory     | Package                        | Role                                                                                                                                                                |
| ------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `angular/`    | `@slotted/demo-nexora-angular` | The Angular application. Installs the library from `../../.registry`                                                                                                |
| `backend/`    | `@slotted/demo-nexora-backend` | In-process simulated API and deterministic seed. Workspace package.                                                                                                 |
| `domain.md`   | —                              | Domain and product specification. Part II is normative for `backend`                                                                                                |
| `guidelines/` | —                              | Rules of the Nexora domain. Rules for any application ship in the package (`tools/agent-docs/content/guidelines/`). `guidelines/README.md` has the reading protocol |

## Families available to screens

Every entry point of `@slotted/angular` is available to a Nexora screen. The
most recent additions:

- `chart` (`@slotted/angular/chart`, `figure[slChart]`): line, area, bar, pie
  and scatter series over one record array, with legend, tooltip, toolbar,
  zoom, selection, annotations and a table view of the same data. It answers the width
  of its container, not the viewport. The engine is `echarts`, an optional
  peer of `@slotted/core`: the demo's `package.json` does not declare it yet,
  and the first screen that draws a chart adds it. `preloadChartEngine(kinds)`
  in a route resolver fetches the engine before the first chart paints. A
  single figure without a series stays a `stat-card`.
- `column-manager` and `saved-views`, composed around `data-grid` in the list
  pages.

`angular/LIBRARY-FEEDBACK.md` is the ledger of package defects and gaps seen
from this application; `AGENTS.md` › "Demo Feedback Loop" says how an entry is
triaged. `CONTRIBUTING.md` › "The beta channel" says how the tarballs are
written.
