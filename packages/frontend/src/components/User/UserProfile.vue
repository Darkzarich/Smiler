<template>
  <div class="user-profile u-flex-row">
    <div class="user-profile__avatar">
      <UserAvatar :src="profileUser.avatar" />
    </div>

    <div class="user-profile__info">
      <div
        class="user-profile__login u-flex-row"
        data-testid="user-profile-login"
      >
        {{ profileUser.login }}

        <BaseButton
          v-if="!isSameUser"
          class="user-profile__follow-btn"
          :data-testid="
            isFollowed ? 'user-profile-unfollow-btn' : 'user-profile-follow-btn'
          "
          :loading="isRequesting"
          :type="isFollowed ? 'secondary' : 'primary'"
          @click="handleFollow"
        >
          {{ isFollowed ? 'Unfollow' : 'Follow' }}
        </BaseButton>
      </div>

      <div class="user-profile__date">
        Became an author {{ formatFromNow(profileUser.createdAt) }}
      </div>

      <UserOfflineBadge :last-login-at="profileUser.lastLoginAt" />

      <div
        v-if="profileUser.bio"
        class="user-profile__bio"
        data-testid="user-profile-bio"
      >
        <i>{{ profileUser.bio }}</i>
      </div>

      <UserStats :stats="profileUser" />
    </div>

    <IconSmiley
      class="user-profile__watermark"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import { api } from '@/api';
import type { userTypes } from '@/api/users';
import { useAuthPromptStore } from '@/store/auth-prompt';
import { useUserStore } from '@/store/user';
import { formatFromNow } from '@/utils/format-from-now';
import BaseButton from '@common/BaseButton.vue';
import UserAvatar from '@components/User/UserAvatar.vue';
import IconSmiley from '@icons/IconSmiley.vue';
import UserOfflineBadge from '@components/User/UserOfflineBadge.vue';
import UserStats from '@components/User/UserStats.vue';

interface Props {
  user: userTypes.GetUserProfileResponse;
}

const props = defineProps<Props>();

const profileUser = ref({ ...props.user });

const isRequesting = ref(false);

const userStore = useUserStore();

const { user: currentUser } = storeToRefs(userStore);

const authPrompt = useAuthPromptStore();

const isSameUser = computed(
  () => currentUser.value?._id === profileUser.value._id,
);
const isFollowed = computed(
  () => Boolean(currentUser.value) && profileUser.value.isFollowed,
);

watch(
  () => props.user,
  (user) => {
    profileUser.value = { ...user };
  },
);

async function follow() {
  if (isRequesting.value) {
    return;
  }

  try {
    isRequesting.value = true;

    await api.users.followUser(profileUser.value._id);

    profileUser.value.followersAmount = profileUser.value.followersAmount + 1;
    profileUser.value.isFollowed = true;
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

    await api.users.unfollowUser(profileUser.value._id);

    profileUser.value.followersAmount = profileUser.value.followersAmount - 1;
    profileUser.value.isFollowed = false;
  } finally {
    isRequesting.value = false;
  }
}

async function followAfterSignIn() {
  const isSignedIn = await authPrompt.open({
    title: `Sign in to follow ${profileUser.value.login}`,
  });

  if (!isSignedIn) {
    return;
  }

  // Loaded without a session, so it says nothing about the account's follows
  profileUser.value = await api.users.getUserProfile(profileUser.value.login);

  if (!isSameUser.value && !isFollowed.value) {
    await follow();
  }
}

async function handleFollow() {
  if (!currentUser.value) {
    await followAfterSignIn();

    return;
  }

  if (isFollowed.value) {
    await unfollow();
  } else {
    await follow();
  }
}
</script>

<style>
.user-profile {
  position: relative;
  margin-bottom: var(--variable-widget-margin);
  padding: 1rem;
  border-radius: 8px;
  background: var(--color-surface-secondary);
  color: var(--color-text-primary);

  @media (--phone-only) {
    border: none;
    border-radius: 0;
  }

  /* The slice aspect ratio crops it the way background-size: cover did, and the
     grey is what grayscale() made of the old PNG's green */
  &__watermark {
    display: inline-block;
    position: absolute;
    right: 5%;
    opacity: 0.05;
    width: 48%;
    height: 82%;
    color: rgb(173 173 173);
    pointer-events: none;

    @media (--phone-only) {
      display: none;
    }
  }

  /* TODO: Move avatar to its own component */
  &__avatar {
    margin-right: 1rem;

    .user-avatar {
      width: 7rem;
      height: 7rem;
      border-radius: 50%;
    }
  }

  &__login {
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 1rem;
    font-size: 1.5rem;
  }

  &__follow-btn {
    z-index: 1;
    width: 100px;
    font-size: 13px;
  }

  &__login,
  &__date,
  &__bio {
    margin-bottom: 0.5rem;
  }

  &__date {
    margin-bottom: 12px;
    color: var(--color-text-secondary);
    font-size: 13px;
  }
}
</style>
