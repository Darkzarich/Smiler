<template>
  <div class="user-settings">
    <div v-if="!isFetching" class="user-settings__data">
      <h1 class="user-settings__title">Settings</h1>

      <div class="user-settings__block">
        <h3 class="user-settings__block-title">Following</h3>
        <template v-if="isFollowingAnything">
          <div v-if="usersFollowed.length" class="user-settings__following">
            <div class="user-settings__following-type">Authors:</div>
            <div
              v-for="author in usersFollowed"
              :key="author._id"
              :data-testid="`user-settings-author-${author._id}`"
              class="user-settings__following-item"
            >
              <img
                class="user-settings__following-avatar"
                :src="resolveAvatar(author.avatar)"
                alt="avatar"
              />
              {{ author.login }}
              <span
                class="user-settings__unfollow"
                :data-testid="`user-settings-author-${author._id}-unfollow`"
                @click="handleUnfollowUser(author._id)"
              >
                x
              </span>
            </div>
          </div>

          <div
            v-if="tagsFollowed.length"
            class="user-settings__following"
            data-testid="user-settings-tags"
          >
            <div class="user-settings__following-type">Tags:</div>
            <div
              v-for="tag in tagsFollowed"
              :key="tag"
              :data-testid="`user-settings-tags-${tag}`"
              class="user-settings__following-item user-settings__tag"
            >
              {{ tag }}
              <span
                class="user-settings__unfollow"
                :data-testid="`user-settings-tag-${tag}-unfollow`"
                @click="handleUnfollowTag(tag)"
              >
                x
              </span>
            </div>
          </div>
        </template>

        <div
          v-else
          class="user-settings__following"
          data-testid="user-settings-no-subscriptions"
        >
          <i class="user-settings__no-subscriptions"
            >You don't follow any authors or tags...</i
          >
        </div>
      </div>

      <div class="user-settings__block">
        <h3 class="user-settings__block-title">About me</h3>

        <BaseTextarea
          v-model="bioEditInput"
          data-testid="user-settings-bio-input"
          class="user-settings__bio-edit"
          :error="bioTooLongError"
        />

        <BaseButton
          class="user-settings__submit-btn"
          data-testid="user-settings-bio-submit"
          :is-fetching="bioEditRequesting"
          :disabled="Boolean(bioTooLongError)"
          @click="editBio"
        >
          Save
        </BaseButton>
      </div>

      <div class="user-settings__block">
        <h3 class="user-settings__block-title">Avatar</h3>

        <div class="user-settings__current-avatar">
          <img :src="resolveAvatar(avatarEditInput)" alt="current avatar" />
        </div>

        <BaseInput
          v-model.lazy.trim="avatarEditInput"
          class="user-settings__avatar-edit"
          data-testid="user-settings-avatar-input"
          placeholder="URL to avatar..."
        />

        <BaseButton
          class="user-settings__submit-btn"
          data-testid="user-settings-avatar-submit"
          :is-fetching="avatarEditRequesting"
          :disabled="avatarEditInput.length > consts.USER_MAX_AVATAR_LENGTH"
          @click="editAvatar"
        >
          Save
        </BaseButton>
      </div>
    </div>

    <div v-else class="user-settings__isFetching">
      <CircularLoader />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeMount, ref } from 'vue';
import { api } from '@/api';
import type { GetCurrentUserSettings as Settings } from '@/api/users/types';
import * as consts from '@/const';
import { useNotificationsStore } from '@/store/notifications';
import { useUserStore } from '@/store/user';
import { resolveAvatar } from '@/utils/resolve-avatar';
import BaseButton from '@common/BaseButton.vue';
import BaseInput from '@common/BaseInput.vue';
import BaseTextarea from '@common/BaseTextarea.vue';
import CircularLoader from '@icons/animation/CircularLoader.vue';

const { unfollowTag, setAvatar } = useUserStore();

const { showInfoNotification } = useNotificationsStore();

const isFetching = ref(true);
const isUpdating = ref(false);

const usersFollowed = ref<Settings['authors']>([]);

const handleUnfollowUser = async (id: string) => {
  if (isUpdating.value) {
    return;
  }

  try {
    isUpdating.value = true;

    await api.users.unfollowUser(id);

    const foundUser = usersFollowed.value.find((el) => el._id === id);

    if (foundUser) {
      usersFollowed.value.splice(usersFollowed.value.indexOf(foundUser), 1);
    }

    showInfoNotification({
      message: 'This author was successfully unfollowed!',
    });
  } finally {
    isUpdating.value = false;
  }
};

const tagsFollowed = ref<Settings['tags']>([]);

const handleUnfollowTag = async (tag: string) => {
  if (isUpdating.value) {
    return;
  }

  try {
    isUpdating.value = true;

    await api.tags.unfollow(tag);

    const unfollowedTagIndex = tagsFollowed.value.indexOf(tag);

    if (unfollowedTagIndex !== -1) {
      tagsFollowed.value.splice(unfollowedTagIndex, 1);
    }

    unfollowTag(tag);

    showInfoNotification({
      message: 'This tag was successfully unfollowed!',
    });
  } finally {
    isUpdating.value = false;
  }
};

const isFollowingAnything = computed(
  () => usersFollowed.value.length || tagsFollowed.value.length,
);

const bioEditInput = ref('');
const bioEditRequesting = ref(false);

const bioTooLongError = computed(() => {
  if (bioEditInput.value.length > consts.USER_MAX_BIO_LENGTH) {
    return 'Bio is too long';
  }

  return '';
});

const editBio = async () => {
  try {
    bioEditRequesting.value = true;

    const data = await api.users.updateUserProfile({
      bio: bioEditInput.value,
    });

    showInfoNotification({
      message: 'Your bio has been successfully updated!',
    });

    bioEditInput.value = data.bio;
  } finally {
    bioEditRequesting.value = false;
  }
};

const avatarEditInput = ref('');
const avatarEditRequesting = ref(false);

const editAvatar = async () => {
  try {
    avatarEditRequesting.value = true;

    const data = await api.users.updateUserProfile({
      avatar: avatarEditInput.value,
    });

    setAvatar(avatarEditInput.value);

    showInfoNotification({
      message: 'Your avatar has been successfully updated!',
    });

    avatarEditInput.value = data.avatar;
  } finally {
    avatarEditRequesting.value = false;
  }
};

const fetchData = async () => {
  try {
    isFetching.value = true;

    const data = await api.users.getCurrentUserSettings();

    usersFollowed.value = data.authors;
    tagsFollowed.value = data.tags;
    bioEditInput.value = data.bio;
    avatarEditInput.value = data.avatar;
  } finally {
    isFetching.value = false;
  }
};

onBeforeMount(() => {
  fetchData();
});
</script>

<style lang="scss">
@use '@/styles/mixins';

.user-settings {
  @include mixins.widget;

  @include mixins.for-size(phone-only) {
    border-right: none;
    border-left: none;
    border-radius: 0;
  }

  &__loading {
    display: flex;
    justify-content: center;
  }

  &__title {
    margin-bottom: 12px;
    color: var(--color-main-text);
    text-align: center;
    font-size: 1.5rem;
    font-weight: 500;
  }

  &__block {
    padding: 16px 0;

    &:last-child {
      border-bottom: none;
    }
  }

  &__block-title {
    margin-bottom: 16px;
    color: var(--color-main-text);
    text-align: center;
    font-weight: 400;
  }

  &__bio-edit {
    @include mixins.for-size(phone-only) {
      margin-left: 0;
    }

    textarea {
      width: 50%;
      height: 5rem;
      resize: none;

      @include mixins.for-size(phone-only) {
        width: 100%;
      }
    }
  }

  &__avatar-edit {
    width: 60%;

    @include mixins.for-size(phone-only) {
      width: 80%;
      margin-left: 0;
    }
  }

  &__current-avatar {
    width: 8rem;
    height: 8rem;
    margin-bottom: 12px;

    img {
      width: 128px;
      border: 1px solid var(--color-gray-light);
      border-radius: 50%;
    }
  }

  &__submit-btn {
    width: 140px;
    margin-top: 16px;
  }

  &__no-subscriptions {
    color: var(--color-main-text);
  }

  &__following {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 16px;
    padding-left: 16px;

    @include mixins.for-size(phone-only) {
      padding-left: 0;
    }
  }

  &__following-type {
    color: var(--color-gray-light);
    font-weight: bold;
  }

  &__unfollow {
    color: var(--color-danger);
    font-family: monospace;
    cursor: pointer;
  }

  &__following-item {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--color-main-text);
  }

  &__following-avatar {
    width: 16px;
    height: 16px;
    border: 1px solid var(--color-gray-light);
    border-radius: 50%;
  }

  &__tag {
    padding: 0.1rem;
    border: 1px solid var(--color-primary);
    border-radius: 5px;
    background: transparent;
    color: var(--color-primary);
    font-family: monospace;
    font-size: 0.8rem;
    font-weight: bold;
    user-select: none;
  }
}
</style>
