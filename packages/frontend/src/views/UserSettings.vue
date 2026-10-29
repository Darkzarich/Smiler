<template>
  <div class="user-settings u-widget">
    <div v-if="!isFetching" class="user-settings__data">
      <h1 class="u-page-title">Settings</h1>

      <div class="user-settings__block">
        <h2 class="u-section-title">Following</h2>
        <template v-if="isFollowingAnything">
          <div v-if="usersFollowed.length" class="user-settings__following">
            <div class="user-settings__following-type">Authors:</div>
            <div
              v-for="author in usersFollowed"
              :key="author._id"
              :data-testid="`user-settings-author-${author._id}`"
              class="user-settings__following-item"
            >
              <UserAvatar
                class="user-settings__following-avatar"
                :src="author.avatar"
              />
              {{ author.login }}
              <BaseIconButton
                :label="`Unfollow ${author.login}`"
                :data-testid="`user-settings-author-${author._id}-unfollow`"
                size="xsmall"
                tone="danger"
                @click="handleUnfollowUser(author._id)"
              >
                <IconClose />
              </BaseIconButton>
            </div>
          </div>

          <div
            v-if="tagsFollowed.length"
            class="user-settings__following"
            data-testid="user-settings-tags"
          >
            <div class="user-settings__following-type">Tags:</div>
            <BaseTag
              v-for="tag in tagsFollowed"
              :key="tag"
              :data-testid="`user-settings-tags-${tag}`"
            >
              {{ tag }}
              <template #action>
                <BaseIconButton
                  :label="`Unfollow tag ${tag}`"
                  :data-testid="`user-settings-tag-${tag}-unfollow`"
                  size="xsmall"
                  tone="danger"
                  @click="handleUnfollowTag(tag)"
                >
                  <IconClose />
                </BaseIconButton>
              </template>
            </BaseTag>
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
        <h2 class="u-section-title">About me</h2>

        <BaseTextarea
          v-model="bioEditInput"
          data-testid="user-settings-bio-input"
          class="user-settings__bio-edit"
          :error="bioTooLongError"
        />

        <BaseButton
          class="user-settings__submit-btn"
          data-testid="user-settings-bio-submit"
          type="primary"
          :loading="bioEditRequesting"
          :disabled="Boolean(bioTooLongError)"
          @click="editBio"
        >
          Save
        </BaseButton>
      </div>

      <div class="user-settings__block">
        <h2 class="u-section-title">Avatar</h2>

        <div class="user-settings__current-avatar">
          <UserAvatar :src="currentAvatar" alt="current avatar" />
        </div>

        <BaseInput
          ref="avatarInput"
          v-model.lazy.trim="avatarUrlInput"
          class="user-settings__avatar-edit"
          data-testid="user-settings-avatar-input"
          placeholder="URL to avatar..."
          :error="avatarUrlInput ? '' : 'Paste a link to a picture first'"
          :show-error="isAvatarSubmitted"
        />

        <div class="user-settings__avatar-hint">
          The picture is downloaded and stored here, so the link only has to
          work once.
        </div>

        <BaseButton
          class="user-settings__submit-btn"
          data-testid="user-settings-avatar-submit"
          type="primary"
          :loading="avatarEditRequesting"
          @click="editAvatar"
        >
          Save
        </BaseButton>

        <BaseButton
          v-if="currentAvatar"
          class="user-settings__submit-btn"
          data-testid="user-settings-avatar-remove"
          :loading="avatarRemoveRequesting"
          @click="removeAvatar"
        >
          Remove
        </BaseButton>
      </div>
    </div>

    <div v-else class="user-settings__isFetching">
      <CircularLoader />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeMount, ref, useTemplateRef } from 'vue';
import { api } from '@/api';
import { userTypes } from '@/api/users';
import * as consts from '@/const';
import { useNotificationsStore } from '@/store/notifications';
import { useUserStore } from '@/store/user';
import BaseButton from '@common/BaseButton.vue';
import BaseIconButton from '@common/BaseIconButton.vue';
import BaseInput from '@common/BaseInput.vue';
import BaseTag from '@common/BaseTag.vue';
import BaseTextarea from '@common/BaseTextarea.vue';
import CircularLoader from '@icons/animation/CircularLoader.vue';
import IconClose from '@icons/IconClose.vue';
import UserAvatar from '@components/User/UserAvatar.vue';

const { unfollowTag, setAvatar } = useUserStore();

const { showInfoNotification } = useNotificationsStore();

const isFetching = ref(true);
const isUpdating = ref(false);

const usersFollowed = ref<userTypes.GetCurrentUserSettings['authors']>([]);

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

const tagsFollowed = ref<userTypes.GetCurrentUserSettings['tags']>([]);

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

/** What the backend stored, which is a path under its uploads folder — never
 * the link that was pasted to get it there. */
const currentAvatar = ref('');
const avatarUrlInput = ref('');
const avatarEditRequesting = ref(false);
const avatarRemoveRequesting = ref(false);
const isAvatarSubmitted = ref(false);

const avatarInput =
  useTemplateRef<InstanceType<typeof BaseInput>>('avatarInput');

const editAvatar = async () => {
  if (!avatarUrlInput.value) {
    isAvatarSubmitted.value = true;
    avatarInput.value?.focus();

    return;
  }

  try {
    avatarEditRequesting.value = true;

    const data = await api.users.updateMyAvatar({ url: avatarUrlInput.value });

    currentAvatar.value = data.avatar;
    avatarUrlInput.value = '';
    isAvatarSubmitted.value = false;

    setAvatar(data.avatar);

    showInfoNotification({
      message: 'Your avatar has been successfully updated!',
    });
  } finally {
    avatarEditRequesting.value = false;
  }
};

const removeAvatar = async () => {
  try {
    avatarRemoveRequesting.value = true;

    await api.users.deleteMyAvatar();

    currentAvatar.value = '';

    setAvatar('');

    showInfoNotification({
      message: 'Your avatar has been removed.',
    });
  } finally {
    avatarRemoveRequesting.value = false;
  }
};

const fetchData = async () => {
  try {
    isFetching.value = true;

    const data = await api.users.getCurrentUserSettings();

    usersFollowed.value = data.authors;
    tagsFollowed.value = data.tags;
    bioEditInput.value = data.bio;
    currentAvatar.value = data.avatar;
  } finally {
    isFetching.value = false;
  }
};

onBeforeMount(() => {
  fetchData();
});
</script>

<style>
.user-settings {
  &__loading {
    display: flex;
    justify-content: center;
  }

  &__block {
    padding: 16px 0;

    &:last-child {
      border-bottom: none;
    }
  }

  &__bio-edit {
    @media (--phone-only) {
      margin-left: 0;
    }

    textarea {
      width: 50%;
      height: 5rem;
      resize: none;

      @media (--phone-only) {
        width: 100%;
      }
    }
  }

  &__avatar-hint {
    margin-top: 8px;
    color: var(--color-text-secondary);
    font-size: 12px;
  }

  &__avatar-edit {
    width: 60%;

    @media (--phone-only) {
      width: 80%;
      margin-left: 0;
    }
  }

  &__current-avatar {
    width: 8rem;
    height: 8rem;
    margin-bottom: 12px;

    .user-avatar {
      width: 128px;
      border: 1px solid var(--color-text-secondary);
      border-radius: 50%;
    }
  }

  &__submit-btn {
    width: 140px;
    margin-top: 16px;
  }

  &__no-subscriptions {
    color: var(--color-text-primary);
  }

  &__following {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 16px;
    padding-left: 16px;

    @media (--phone-only) {
      padding-left: 0;
    }
  }

  &__following-type {
    color: var(--color-text-secondary);
    font-weight: bold;
  }

  &__following-item {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--color-text-primary);
  }

  &__following-avatar {
    width: 16px;
    height: 16px;
    border: 1px solid var(--color-text-secondary);
    border-radius: 50%;
  }
}
</style>
