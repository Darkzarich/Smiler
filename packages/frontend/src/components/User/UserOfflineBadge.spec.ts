import { mount } from '@vue/test-utils';
import { subDays } from 'date-fns';
import { describe, it, expect } from 'vitest';
import UserOfflineBadge from './UserOfflineBadge.vue';
import * as consts from '@/const';

const testElements = {
  badge: '[data-testid="user-profile-offline-badge"]',
};

function createWrapper(lastLoginAt?: string) {
  return mount(UserOfflineBadge, {
    props: { lastLoginAt },
  });
}

function daysAgo(days: number) {
  return subDays(new Date(), days).toISOString();
}

describe('UserOfflineBadge', () => {
  it('Renders nothing for a user who has no last login date stored', () => {
    const wrapper = createWrapper();

    expect(wrapper.find(testElements.badge).exists()).toBe(false);
  });

  it('Renders nothing for a user who signed in recently', () => {
    const wrapper = createWrapper(daysAgo(consts.USER_LONG_OFFLINE_DAYS - 1));

    expect(wrapper.find(testElements.badge).exists()).toBe(false);
  });

  it('Renders the badge once the user has been away for the whole threshold', () => {
    const wrapper = createWrapper(daysAgo(consts.USER_LONG_OFFLINE_DAYS));

    expect(wrapper.find(testElements.badge).exists()).toBe(true);
  });

  it('Tells how long the user has been away', () => {
    const wrapper = createWrapper(daysAgo(90));

    expect(wrapper.find(testElements.badge).text()).toContain(
      'Away · last seen 3 months ago',
    );
  });
});
