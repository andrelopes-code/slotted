import { describe, expect, it } from 'vitest';
import { destinationFor, NAV_MODULES, visibleModules } from './nav.model';

describe('nav model', () => {
  it('hides modules the session cannot view', () => {
    const jordan = new Set(['inventory.view', 'shipments.view', 'catalog.view', 'orders.view']);
    const visible = visibleModules((p) => jordan.has(p)).map((m) => m.id);
    expect(visible).toEqual(['home', 'sales', 'catalog', 'inventory', 'activity']);
  });
  it('shows every module to an administrator', () => {
    expect(visibleModules(() => true).length).toBe(NAV_MODULES.length);
  });
  it('resolves a url to its destination', () => {
    expect(destinationFor('/sales/orders/ord_000001')?.destination.id).toBe('sales.orders');
    expect(destinationFor('/nowhere')).toBeUndefined();
  });
});
