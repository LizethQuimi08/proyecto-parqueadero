import { getRabbitRoutingPattern } from './audit.consumer';

describe('getRabbitRoutingPattern', () => {
  it('uses a broad default binding so vehicle events are consumed', () => {
    expect(getRabbitRoutingPattern(undefined)).toBe('audit.#');
  });

  it('preserves an explicitly configured routing key', () => {
    expect(getRabbitRoutingPattern('audit.vehiculo.create')).toBe('audit.vehiculo.create');
  });
});
