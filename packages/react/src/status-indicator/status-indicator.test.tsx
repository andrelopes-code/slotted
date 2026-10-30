import { statusIndicatorMessages } from '@slotted/core/i18n';
import { PT_BR } from '@slotted/core/i18n/pt-BR';
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import contract from '../../../../specs/components/status-indicator/contract.json';
import { SlottedProvider } from '../i18n';
import { StatusIndicator, StatusIndicatorDefaultsProvider } from './index';
import type { StatusIndicatorStatus } from './index';

const root = () => document.querySelector('[data-ui="status-indicator"][data-part="root"]')!;
const mark = () => document.querySelector('[data-part="mark"]')!;
const label = () => document.querySelector('[data-part="label"]')!;
const announcement = () => document.querySelector('[data-part="announcement"]');

const STATUSES = contract.axes.status as StatusIndicatorStatus[];

describe('StatusIndicator', () => {
  it('is selected in public by the family identifier, never by a class', () => {
    render(<StatusIndicator className="app-status">Healthy</StatusIndicator>);

    expect(root()).toHaveAttribute('data-ui', 'status-indicator');
    expect(root()).toHaveAttribute('data-part', 'root');
    expect(root()).toHaveClass('app-status');
    expect(root().className).toBe('app-status');
  });

  it('renders the defaults the contract declares', () => {
    render(<StatusIndicator>Draft</StatusIndicator>);

    for (const [axis, value] of Object.entries(contract.members.statusIndicator.defaults)) {
      if (axis === 'pulse' || axis === 'live') continue;
      expect(root()).toHaveAttribute(`data-${axis}`, String(value));
    }
    expect(root()).not.toHaveAttribute('data-pulse');
    expect(root()).not.toHaveAttribute('role');
  });

  it('renders the three parts, and hides the one that is not for a reader', () => {
    render(<StatusIndicator>Healthy</StatusIndicator>);

    expect(mark()).toHaveAttribute('aria-hidden', 'true');
    expect(label()).toHaveTextContent('Healthy');
    expect(announcement()).toBeNull();
  });

  /**
   * The icon mark is the family's non-chromatic answer, so the artwork each
   * status draws is the contract's, rendered as the `Glyph` element. The dot
   * holds none: it is painted, not drawn.
   */
  it('draws the glyph the contract names for each status, and none in a dot', () => {
    for (const status of STATUSES) {
      const { unmount } = render(
        <StatusIndicator mark="icon" status={status}>
          Build
        </StatusIndicator>,
      );
      const glyphs = mark().querySelectorAll('[data-ui="icon"] > svg[data-glyph]');
      expect(glyphs).toHaveLength(1);
      expect(glyphs[0]).toHaveAttribute('data-glyph', contract.statusGlyphs[status]);
      unmount();
    }

    render(<StatusIndicator status="danger">Build</StatusIndicator>);
    expect(mark().querySelector('svg')).toBeNull();
  });

  /**
   * The family's own rule, and the one every surveyed implementation breaks.
   * Spectrum asks the consumer for an `aria-label` and ships a nameless dot
   * when they forget; here the word is in the document, clipped rather than
   * absent, so it is announced, findable and available to `aria-labelledby`.
   */
  it('names a mark that shows no words, from the status itself', () => {
    render(<StatusIndicator status="danger" />);

    expect(announcement()).toHaveTextContent('Error');
    expect(announcement()).toHaveAttribute('data-ui', 'visually-hidden');
    expect(root()).toHaveTextContent('Error');
    expect(root()).not.toHaveAttribute('aria-label');
    expect(root()).not.toHaveAttribute('role', 'img');
  });

  it('gives every status a word rather than leaving one silent', () => {
    for (const status of STATUSES) {
      const { unmount } = render(<StatusIndicator status={status} />);
      expect(document.querySelector('[data-part="announcement"]')?.textContent?.trim()).toBe(
        statusIndicatorMessages.base[status],
      );
      unmount();
    }
  });

  /**
   * Naming an element twice is how a reader comes to hear “Success Healthy”.
   * The visible words win, and `label` is the branch that never runs beside
   * them.
   */
  it('does not name itself twice when the page already wrote the words', () => {
    render(
      <StatusIndicator label="Success" status="success">
        Healthy
      </StatusIndicator>,
    );

    expect(announcement()).toBeNull();
    expect(root()).toHaveTextContent('Healthy');
    expect(root().textContent).toBe('Healthy');
  });

  it('sets the detail inside the label, after the words', () => {
    render(
      <StatusIndicator detail="62% · build" status="info">
        Deploying
      </StatusIndicator>,
    );

    const detail = label().querySelector(':scope > [data-part="detail"]');
    expect(detail).toHaveTextContent('62% · build');
    expect(label().lastElementChild).toBe(detail);
    expect(label().firstChild?.textContent).toBe('Deploying');
  });

  it('takes the word a consumer wrote over the status’s own', () => {
    render(<StatusIndicator label="Deploy failed" status="danger" />);

    expect(announcement()).toHaveTextContent('Deploy failed');
  });

  it('carries the pulse as an attribute a stylesheet can answer', () => {
    render(<StatusIndicator pulse status="info" />);

    expect(root()).toHaveAttribute('data-pulse');
  });

  describe('announcing', () => {
    it('says nothing about a status that was already on the page', () => {
      render(<StatusIndicator status="success">Healthy</StatusIndicator>);

      expect(root()).not.toHaveAttribute('role');
    });

    it('becomes a polite live region on request', () => {
      render(
        <StatusIndicator live="polite" status="info">
          Deploying
        </StatusIndicator>,
      );

      expect(screen.getByRole('status')).toHaveTextContent('Deploying');
    });

    it('interrupts only when an application asks it to', () => {
      render(
        <StatusIndicator live="assertive" status="danger">
          Region offline
        </StatusIndicator>,
      );

      expect(screen.getByRole('alert')).toHaveTextContent('Region offline');
    });

    it('never replaces a role the consumer wrote', () => {
      render(
        <StatusIndicator live="polite" role="note">
          Draft
        </StatusIndicator>,
      );

      expect(root()).toHaveAttribute('role', 'note');
    });
  });

  describe('defaults', () => {
    it('lets an application decide the mark, the size and the announcing once', () => {
      render(
        <StatusIndicatorDefaultsProvider live="polite" mark="icon" size="sm">
          <StatusIndicator status="warning">Degraded</StatusIndicator>
        </StatusIndicatorDefaultsProvider>,
      );

      expect(root()).toHaveAttribute('data-mark', 'icon');
      expect(root()).toHaveAttribute('data-size', 'sm');
      expect(root()).toHaveAttribute('role', 'status');
    });

    it('lets an explicit prop win over the application’s decision', () => {
      render(
        <StatusIndicatorDefaultsProvider mark="icon" size="sm">
          <StatusIndicator mark="dot" size="lg" status="warning">
            Degraded
          </StatusIndicator>
        </StatusIndicatorDefaultsProvider>,
      );

      expect(root()).toHaveAttribute('data-mark', 'dot');
      expect(root()).toHaveAttribute('data-size', 'lg');
    });

    it('speaks the six words in the language in force', () => {
      render(
        <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
          <StatusIndicator status="danger" />
        </SlottedProvider>,
      );

      expect(announcement()).toHaveTextContent('Erro');
    });

    /** An indicator that renames one status keeps the five the catalog names. */
    it('lays its own messages over the catalog key by key', () => {
      render(
        <SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
          <StatusIndicator messages={{ success: 'Pronto' }} status="danger" />
          <StatusIndicator messages={{ success: 'Pronto' }} status="success" />
        </SlottedProvider>,
      );

      const words = [...document.querySelectorAll('[data-part="announcement"]')].map(
        (node) => node.textContent,
      );
      expect(words).toEqual(['Erro', 'Pronto']);
    });
  });

  describe('the surface a consumer reaches', () => {
    it('passes native attributes and events to the element that owns them', () => {
      const ref = createRef<HTMLSpanElement>();
      render(
        <StatusIndicator id="deploy-status" ref={ref} title="Last checked 2 minutes ago">
          Healthy
        </StatusIndicator>,
      );

      expect(root()).toHaveAttribute('id', 'deploy-status');
      expect(root()).toHaveAttribute('title', 'Last checked 2 minutes ago');
      expect(ref.current).toBe(root());
    });

    it('substitutes the rendered element and hands it every part', () => {
      render(
        <StatusIndicator render={(props) => <a href="/builds/4821" {...props} />} status="danger">
          Build 4821 failed
        </StatusIndicator>,
      );

      const link = screen.getByRole('link', { name: 'Build 4821 failed' });
      expect(link).toHaveAttribute('data-ui', 'status-indicator');
      expect(link).toHaveAttribute('data-status', 'danger');
      expect(link.querySelector('[data-part="mark"]')).not.toBeNull();
    });
  });
});
