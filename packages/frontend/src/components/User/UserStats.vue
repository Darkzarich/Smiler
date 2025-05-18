<template>
  <div class="user-stats">
    <div
      :class="{
        'user-stats__stat--positive': user.rating > 0,
        'user-stats__stat--negative': user.rating < 0,
      }"
      class="user-stats__stat"
      data-testid="user-profile-rating"
    >
      <span class="user-stats__stat-count">{{ user.rating }} </span>
      <span class="user-stats__stat-count-label">Rating</span>
    </div>

    <div class="user-stats__stat" data-testid="user-profile-followers-count">
      <span class="user-stats__stat-count">{{ user.followersAmount }} </span>
      <span class="user-stats__stat-count-label">Followers</span>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    user: {
      type: Object,
      default: () => ({}),
    },
  },
});
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
