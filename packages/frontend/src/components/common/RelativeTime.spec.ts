import { enableAutoUnmount, mount } from '@vue/test-utils';
import { format } from 'date-fns';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import RelativeTime from './RelativeTime.vue';

const NOW = new Date('2026-11-21T12:00:00.000Z');
const FIFTEEN_MINUTES_AGO = new Date('2026-11-21T11:45:00.000Z');

describe('RelativeTime', () => {
  enableAutoUnmount(afterEach);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps the exact moment behind the relative text', () => {
    const wrapper = mount(RelativeTime, {
      props: { date: FIFTEEN_MINUTES_AGO.toISOString() },
    });
    const time = wrapper.get('time');

    expect(time.text()).toBe('15 minutes ago');
    expect(time.attributes('datetime')).toBe('2026-11-21T11:45:00.000Z');
    expect(time.attributes('title')).toBe(format(FIFTEEN_MINUTES_AGO, 'PPp'));
  });

  it('counts up while the page stays open', async () => {
    const wrapper = mount(RelativeTime, {
      props: { date: FIFTEEN_MINUTES_AGO.toISOString() },
    });

    expect(wrapper.get('time').text()).toBe('15 minutes ago');

    vi.advanceTimersByTime(60_000);
    await nextTick();

    expect(wrapper.get('time').text()).toBe('16 minutes ago');
  });
});
