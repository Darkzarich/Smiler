<template>
  <div
    v-if="isLongOffline"
    class="user-offline-badge"
    :title="`Last signed in on ${signedInOn}`"
    data-testid="user-profile-offline-badge"
  >
    <span class="user-offline-badge__dot" />

    <span>Away · last seen {{ lastSeen }}</span>
  </div>
</template>

<script setup lang="ts">
import { differenceInDays, format } from 'date-fns';
import { computed } from 'vue';
import * as consts from '@/const';
import { formatFromNow } from '@/utils/format-from-now';

interface Props {
  lastLoginAt?: string;
}

const props = defineProps<Props>();

/**
 * Users who never signed in since the date started being tracked have nothing
 * stored, and an absent date says nothing about how long they have been away.
 */
const isLongOffline = computed(() => {
  if (!props.lastLoginAt) {
    return false;
  }

  return (
    differenceInDays(new Date(), new Date(props.lastLoginAt)) >=
    consts.USER_LONG_OFFLINE_DAYS
  );
});

const lastSeen = computed(() => formatFromNow(props.lastLoginAt ?? ''));

const signedInOn = computed(() =>
  props.lastLoginAt ? format(new Date(props.lastLoginAt), 'PPP') : '',
);
</script>

<style>
.user-offline-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--color-warning-transparent);
  color: var(--color-warning);
  font-size: 12px;
  cursor: default;

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentcolor;
  }
}
</style>
