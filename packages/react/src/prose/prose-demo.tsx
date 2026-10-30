import type { ReactNode } from 'react';

import { ProseAnchor, ProseFootnotes, ProseLead, ProseScroll } from './index';

/**
 * The content every scene on the reference page is set in. It stands in for
 * what a Markdown renderer emits: bare tags, with no attribute the application
 * ever got to write. Keeping it in one place is what makes two scenes
 * comparable — a reader judging `flow` is looking at the same words twice.
 */

/** A stage the whole page uses: this family answers its own inline size. */
export function Stage({ children }: { children: ReactNode }) {
  return (
    <div className="slotted-demo-stage" data-layout="block">
      {children}
    </div>
  );
}

/** The opening of a document: a title, its permalink and a lead. */
export function Opening() {
  return (
    <>
      <h2 id="deploying">
        Deploying a service
        <ProseAnchor href="#deploying" aria-label="Link to this section">
          #
        </ProseAnchor>
      </h2>
      <ProseLead>
        Everything a team needs to move a service from a laptop to production, in the order the
        steps have to happen.
      </ProseLead>
      <p>
        A deployment is three decisions: <strong>where</strong> the code runs, <em>when</em> it
        moves, and who is told. The rest of this page is about the first one.
      </p>
    </>
  );
}

/** Two paragraphs and a list: enough to read a rhythm from. */
export function Rhythm() {
  return (
    <>
      <h3>Prerequisites</h3>
      <p>
        The command line tool, installed with <code>npm i -g @acme/cli</code>, and an account with{' '}
        <code>deploy</code> permission on the target project.
      </p>
      <ul>
        <li>Version 4 or later.</li>
        <li>
          Authenticated once with <kbd>acme login</kbd>.
        </li>
      </ul>
    </>
  );
}

/** Everything a Markdown renderer can emit, once. */
export function Specimen() {
  return (
    <>
      <Opening />
      <Rhythm />
      <blockquote>
        <p>
          A deployment that cannot be reversed is not a deployment. It is a migration, and it needs
          a different review.
        </p>
      </blockquote>
      <h3>Running it</h3>
      <pre>
        <code>
          {'acme deploy --env production --wait\n  ✓ built in 14s\n  ✓ 3 instances healthy'}
        </code>
      </pre>
      <ol>
        <li>Build the image.</li>
        <li>Push it to the registry.</li>
        <li>Roll the instances, one zone at a time.</li>
      </ol>
      <WideTable />
      <hr />
      <dl>
        <dt>Zone</dt>
        <dd>One failure domain. A roll never touches two at once.</dd>
        <dt>Gate</dt>
        <dd>A condition that has to hold before the next zone starts.</dd>
      </dl>
      <details>
        <summary>What happens when a gate fails</summary>
        <p>
          The roll stops where it is. Instances already replaced keep serving, and the ones behind
          the gate stay on the previous revision.
        </p>
      </details>
      <p>
        Deprecated flags are struck through: <del>--fast</del> became <ins>--no-wait</ins> in
        version 4. Terms are marked on first use, like <mark>blue-green</mark>, and{' '}
        <abbr title="Service Level Objective">SLO</abbr> targets are checked at each gate.
        <sup>1</sup>
      </p>
      <h6>Revision history</h6>
      <p>
        <small>Last reviewed in March, by the platform team.</small>
      </p>
      <ProseFootnotes>
        <ol>
          <li>Measured over the trailing seven days, not over the deployment window.</li>
        </ol>
      </ProseFootnotes>
    </>
  );
}

/** A table wider than any column this page gives it. */
export function WideTable() {
  return (
    <ProseScroll labelledBy="environments">
      <table>
        <caption id="environments">Environments and their gates</caption>
        <thead>
          <tr>
            <th>Environment</th>
            <th>Approval</th>
            <th>Rollback window</th>
            <th>Notified</th>
            <th>Latency budget</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>development</td>
            <td>none</td>
            <td>—</td>
            <td>nobody</td>
            <td>—</td>
          </tr>
          <tr>
            <td>staging</td>
            <td>automatic</td>
            <td>1 hour</td>
            <td>the owning team</td>
            <td>250 ms</td>
          </tr>
          <tr>
            <td>production</td>
            <td>two reviewers</td>
            <td>24 hours</td>
            <td>the owning team and the on-call rota</td>
            <td>120 ms</td>
          </tr>
        </tbody>
      </table>
    </ProseScroll>
  );
}
