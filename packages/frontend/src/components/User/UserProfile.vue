<template>
  <div class="user-profile">
    <DefineFollowButton>
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
        <span v-if="isFollowed" class="user-profile__follow-labels">
          <span class="user-profile__following-label">
            <IconCheck aria-hidden="true" />
            Following
          </span>

          <span class="user-profile__unfollow-label" aria-hidden="true">
            Unfollow
          </span>
        </span>

        <template v-else>Follow</template>
      </BaseButton>
    </DefineFollowButton>

    <div class="user-profile__avatar">
      <UserAvatar :src="profileUser.avatar" />
    </div>

    <div class="user-profile__info">
      <div
        class="user-profile__login u-flex-row"
        data-testid="user-profile-login"
      >
        {{ profileUser.login }}

        <ReuseFollowButton v-if="!isPhone" />
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

    <ReuseFollowButton v-if="isPhone" />

    <IconSmiley
      class="user-profile__watermark"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    />
  </div>
</template>

<script setup lang="ts">
import { createReusableTemplate, until } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import { api } from '@/api';
import { useMediaQuery } from '@/composables/use-media-query';
import type { userTypes } from '@/api/users';
import { useAuthPromptStore } from '@/store/auth-prompt';
import { useUserStore } from '@/store/user';
import { formatFromNow } from '@/utils/format-from-now';
import BaseButton from '@common/BaseButton.vue';
import UserAvatar from '@components/User/UserAvatar.vue';
import IconCheck from '@icons/IconCheck.vue';
import IconSmiley from '@icons/IconSmiley.vue';
import UserOfflineBadge from '@components/User/UserOfflineBadge.vue';
import UserStats from '@components/User/UserStats.vue';

interface Props {
  user: userTypes.GetUserProfileResponse;
}

const props = defineProps<Props>();

const [DefineFollowButton, ReuseFollowButton] = createReusableTemplate();

// Beside the login a long login leaves the button a sliver of a phone screen
const isPhone = useMediaQuery('phone-only');

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

/** Whose follow `profileUser.isFollowed` says: it comes with the session the
 * profile was loaded with */
const loadedFor = ref(userStore.userId);

watch(
  () => userStore.userId,
  async (userId) => {
    if (userId) {
      try {
        const reloaded = await api.users.getUserProfile(
          profileUser.value.login,
        );

        if (userStore.userId === userId) {
          profileUser.value = reloaded;
        }
      } catch {
        // The API client has told the user; the button keeps what it shows
      }
    }

    if (userStore.userId === userId) {
      loadedFor.value = userId;
    }
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

  await until(() => loadedFor.value === userStore.userId).toBe(true);

  if (currentUser.value && !isSameUser.value && !isFollowed.value) {
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
  display: grid;
  align-items: start;
  position: relative;
  margin-bottom: var(--variable-widget-margin);
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 0 0 1px var(--color-card-edge);
  background: var(--color-surface-secondary);
  color: var(--color-text-primary);
  grid-template-columns: auto minmax(0, 1fr);
  column-gap: 1rem;

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
    .user-avatar {
      width: 7rem;
      height: 7rem;
      border-radius: 50%;

      /* A 15-character login needs 187px; at 600px a 112px avatar leaves it 169 */
      @media (--tablet-portrait-down) {
        width: 4rem;
        height: 4rem;
      }
    }
  }

  &__login {
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 1rem;
    font-size: 1.5rem;
    overflow-wrap: anywhere;
  }

  &__follow-btn {
    z-index: 1;
    min-width: 100px;
    font-size: 13px;

    @media (--phone-only) {
      margin-top: 1rem;
      grid-column: 1 / -1;
    }
  }

  /* Both labels share one cell, so the button keeps the wider one's width when
     they swap. Opacity, not visibility: a hidden "Following" would leave the
     button with no accessible name */
  &__follow-labels {
    display: grid;

    > * {
      grid-area: 1 / 1;
      justify-self: center;
    }
  }

  &__following-label {
    display: inline-flex;
    align-items: center;
    gap: 4px;

    svg {
      width: 14px;
      height: 14px;
      fill: currentcolor;
    }
  }

  &__unfollow-label {
    opacity: 0;
  }

  &__follow-btn:focus-visible &__following-label {
    opacity: 0;
  }

  &__follow-btn:focus-visible &__unfollow-label {
    opacity: 1;
  }

  @media (--hover) {
    &__follow-btn:hover &__following-label {
      opacity: 0;
    }

    &__follow-btn:hover &__unfollow-label {
      opacity: 1;
    }
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
