<template>
  <div class="user-profile">
    <div class="user-profile__avatar">
      <img :src="resolveAvatar(user.avatar)" :alt="user.avatar" />
    </div>

    <div class="user-profile__info">
      <div class="user-profile__login" data-testid="user-profile-login">
        {{ user.login }}

        <BaseButton
          v-if="currentUser && !isSameUser"
          class="user-profile__follow-btn"
          :data-testid="
            isFollowed ? 'user-profile-unfollow-btn' : 'user-profile-follow-btn'
          "
          :loading="isRequesting"
          :type="isFollowed ? 'danger' : 'primary'"
          @click="handleFollow"
        >
          {{ isFollowed ? 'Unfollow' : 'Follow' }}
        </BaseButton>
      </div>

      <div class="user-profile__date">
        Became an author {{ formatFromNow(user.createdAt) }}
      </div>

      <div
        v-if="user.bio"
        class="user-profile__bio"
        data-testid="user-profile-bio"
      >
        <i>{{ user.bio }}</i>
      </div>

      <UserStats :stats="user" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/api';
import type { userTypes } from '@/api/users';
import { useUserStore } from '@/store/user';
import { formatFromNow } from '@/utils/format-from-now';
import { resolveAvatar } from '@/utils/resolve-avatar';
import BaseButton from '@common/BaseButton.vue';
import UserStats from '@components/User/UserStats.vue';

interface Props {
  user: userTypes.GetUserProfileResponse;
}

const props = defineProps<Props>();

const isRequesting = ref(false);

const userStore = useUserStore();

const { user: currentUser } = storeToRefs(userStore);

const isSameUser = computed(() => currentUser.value?.id === props.user.id);
const isFollowed = computed(() => props.user.isFollowed);

async function follow() {
  if (isRequesting.value) {
    return;
  }

  try {
    isRequesting.value = true;

    await api.users.followUser(props.user.id);

    props.user.followersAmount = props.user.followersAmount + 1;
    props.user.isFollowed = true;
  } finally {
    isRequesting.value = false;
  }
}

async function unfollow() {
  if (isRequesting.value) {
    return;
  }

  try {
    isRequesting.value = true;

    await api.users.unfollowUser(props.user.id);

    props.user.followersAmount = props.user.followersAmount - 1;
    props.user.isFollowed = false;
  } finally {
    isRequesting.value = false;
  }
}

async function handleFollow() {
  if (isFollowed.value) {
    await unfollow();
  } else {
    await follow();
  }
}
</script>

<style lang="scss">
@use '@/styles/mixins';

.user-profile {
  @include mixins.flex-row;

  position: relative;
  margin-bottom: var(--variable-widget-margin);
  margin-left: 10%;
  padding: 1rem;
  border-radius: 8px;
  background: var(--color-widget-bg);
  color: var(--color-main-text);

  @include mixins.for-size(phone-only) {
    width: 100%;
    margin-left: 0;
    border: none;
    border-radius: 0;
  }

  &::after {
    display: inline-block;
    position: absolute;
    right: 5%;
    opacity: 0.05;
    width: 48%;
    height: 82%;
    background-image: url('../../assets/neutral_avatar.png');
    background-position: center;
    background-size: cover;
    background-repeat: no-repeat;
    content: '';
    filter: grayscale(1);
    pointer-events: none;

    @include mixins.for-size(phone-only) {
      display: none;
    }
  }

  // TODO: Move avatar to its own component
  &__avatar {
    margin-right: 1rem;

    img {
      width: 7rem;
      height: 7rem;
      border-radius: 50%;
    }
  }

  &__login {
    @include mixins.flex-row;

    align-items: center;
    font-size: 1.5rem;
  }

  &__follow-btn {
    z-index: 1;
    width: 100px;
    margin-left: 1rem;
    font-size: 13px;
  }

  &__login,
  &__date,
  &__bio {
    margin-bottom: 0.5rem;
  }

  &__date {
    margin-bottom: 12px;
    color: var(--color-gray-light);
    font-size: 13px;
  }
}
</style>
