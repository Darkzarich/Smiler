<template>
  <div class="user-stats">
    <div
      :class="{
        'user-stats__stat--positive': stats.rating > 0,
        'user-stats__stat--negative': stats.rating < 0,
      }"
      class="user-stats__stat"
      data-testid="user-profile-rating"
    >
      <span class="user-stats__stat-count">{{ stats.rating }} </span>
      <span class="user-stats__stat-count-label">Rating</span>
    </div>

    <div class="user-stats__stat" data-testid="user-profile-followers-count">
      <span class="user-stats__stat-count">{{ stats.followersAmount }} </span>
      <span class="user-stats__stat-count-label">Followers</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { userTypes } from '@/api/users';

defineProps<{
  stats: Pick<userTypes.GetUserProfileResponse, 'rating' | 'followersAmount'>;
}>();
</script>

<style lang="scss">
@use '@/styles/mixins';

.user-stats {
  @include mixins.flex-row;

  gap: 2rem;
  color: var(--color-main-text);

  &__stat-count {
    font-size: 28px;
  }

  &__stat {
    display: flex;
    flex-direction: column;
    font-size: 14px;

    &--negative .user-stats__stat-count {
      color: var(--color-danger-dark);
    }

    &--positive .user-stats__stat-count {
      color: var(--color-primary-dark);
    }
  }
}
</style>
