<template>
  <div class="user-settings">
    <div v-if="!loading" class="user-settings__data">
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
                @click="unfollowUser(author._id)"
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
                @click="unfollowTag(tag)"
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
          :loading="bioEditRequesting"
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
          :loading="avatarEditRequesting"
          :disabled="avatarEditInput.length > USER_MAX_AVATAR_LENGTH"
          @click="editAvatar"
        >
          Save
        </BaseButton>
      </div>
    </div>

    <div v-else class="user-settings__loading">
      <CircularLoader />
    </div>
  </div>
</template>

<script>
import api from '@/api';
import consts from '@/const/const';
import { resolveAvatar } from '@/utils/resolve-avatar';
import BaseButton from '@common/BaseButton.vue';
import BaseInput from '@common/BaseInput.vue';
import BaseTextarea from '@common/BaseTextarea.vue';
import CircularLoader from '@icons/animation/CircularLoader.vue';

export default {
  components: {
    CircularLoader,
    BaseInput,
    BaseTextarea,
    BaseButton,
  },
  data() {
    return {
      usersFollowed: [],
      tagsFollowed: [],
      loading: true,
      requestingForTags: false,
      requestingForUsers: false,
      bioEditInput: '',
      bioEditRequesting: false,
      avatarEditInput: '',
      avatarEditRequesting: false,
      USER_MAX_BIO_LENGTH: consts.USER_MAX_BIO_LENGTH,
      USER_MAX_AVATAR_LENGTH: consts.USER_MAX_AVATAR_LENGTH,
    };
  },
  computed: {
    isFollowingAnything() {
      return this.usersFollowed.length || this.tagsFollowed.length;
    },
    bioTooLongError() {
      if (this.bioEditInput.length > this.USER_MAX_BIO_LENGTH) {
        return 'Bio is too long';
      }

      return '';
    },
  },
  created() {
    this.getData();
  },
  methods: {
    resolveAvatar,
    async getData() {
      this.loading = true;

      const { data } = await api.users.getUserSettings();

      if (!data.error) {
        this.usersFollowed = data.authors;
        this.tagsFollowed = data.tags;
        this.bioEditInput = data.bio;
        this.avatarEditInput = data.avatar;
      }

      this.loading = false;
    },
    async editBio() {
      this.bioEditRequesting = true;

      const res = await api.users.updateUserProfile({
        bio: this.bioEditInput,
      });

      this.bioEditRequesting = false;

      if (!res.data.error) {
        this.$store.dispatch('showInfoNotification', {
          message: 'Your bio has been successfully updated!',
        });

        return;
      }

      this.bioEditInput = res.data.bio;
    },
    async editAvatar() {
      this.avatarEditRequesting = true;

      const res = await api.users.updateUserProfile({
        avatar: this.avatarEditInput,
      });

      this.avatarEditRequesting = false;

      if (!res.data.error) {
        this.$store.commit('setAvatar', this.avatarEditInput);

        this.$store.dispatch('showInfoNotification', {
          message: 'Your avatar has been successfully updated!',
        });

        return;
      }

      this.avatarEditInput = res.data.avatar;
    },
    async unfollowTag(tag) {
      if (!this.requestingForUsers) {
        this.requestingForUsers = true;
        const res = await api.tags.unfollow(tag);

        if (!res.data.error) {
          this.tagsFollowed.splice(this.tagsFollowed.indexOf(tag), 1);
          this.$store.commit('unfollowTag', tag);

          this.$store.dispatch('showInfoNotification', {
            message: 'This tag was successfully unfollowed!',
          });
        }

        this.requestingForUsers = false;
      }
    },
    async unfollowUser(id) {
      if (this.requestingForTags) {
        return;
      }

      this.requestingForTags = true;
      const res = await api.users.unfollowUser(id);

      if (res.data.error) {
        this.requestingForTags = false;
        return;
      }

      const foundUser = this.usersFollowed.find((el) => el._id === id);

      if (foundUser) {
        this.usersFollowed.splice(this.usersFollowed.indexOf(foundUser), 1);
      }

      this.$store.dispatch('showInfoNotification', {
        message: 'This author was successfully unfollowed!',
      });

      this.requestingForTags = false;
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/mixins';

.user-settings {
  @include widget;

  @include for-size(phone-only) {
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
    @include for-size(phone-only) {
      margin-left: 0;
    }

    textarea {
      width: 50%;
      height: 5rem;
      resize: none;

      @include for-size(phone-only) {
        width: 100%;
      }
    }
  }

  &__avatar-edit {
    width: 60%;

    @include for-size(phone-only) {
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

    @include for-size(phone-only) {
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
