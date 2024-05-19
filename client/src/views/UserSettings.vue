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
              :key="author.id"
              :data-testid="`user-settings-author-${author.id}`"
              class="user-settings__following-item"
            >
              {{ author.login }}
              <span
                class="user-settings__unfollow"
                :data-testid="`user-settings-author-${author.id}-unfollow`"
                @click="unfollowUser(author.id)"
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
              class="user-settings__following-item"
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
        <h3 class="user-settings__block-title">Edit Bio</h3>
        <InputElement
          v-model="bioEditInput"
          data-testid="user-settings-bio-input"
          class="user-settings__bio-edit"
          :multiline="true"
          :error="bioTooLongError"
        />
        <div class="user-settings__submit">
          <ButtonElement
            class="user-settings__submit-btn"
            data-testid="user-settings-bio-submit"
            :loading="bioEditRequesting"
            :callback="editBio"
            :disabled="Boolean(bioTooLongError)"
          >
            Submit
          </ButtonElement>
        </div>
      </div>

      <div class="user-settings__block">
        <h3 class="user-settings__block-title">Edit Avatar</h3>
        <div class="user-settings__current-avatar">
          <img :src="$resolveAvatar(avatarEditInput)" alt="current avatar" />
        </div>
        <InputElement
          v-model.lazy.trim="avatarEditInput"
          class="user-settings__avatar-edit"
          data-testid="user-settings-avatar-input"
          placeholder="URL to avatar..."
        />
        <div class="user-settings__submit">
          <ButtonElement
            class="user-settings__submit-btn"
            data-testid="user-settings-avatar-submit"
            :loading="avatarEditRequesting"
            :callback="editAvatar"
            :disabled="avatarEditInput.length > USER_MAX_AVATAR_LENGTH"
          >
            Submit
          </ButtonElement>
        </div>
      </div>
    </div>
    <div v-else class="user-settings__loading">
      <CircularLoader />
    </div>
  </div>
</template>

<script>
import api from '@/api';
import ButtonElement from '@/components/BasicElements/ButtonElement.vue';
import InputElement from '@/components/BasicElements/InputElement.vue';
import consts from '@/const/const';
import CircularLoader from '@/library/svg/animation/CircularLoader.vue';

export default {
  components: {
    CircularLoader,
    InputElement,
    ButtonElement,
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
    async getData() {
      this.loading = true;

      const res = await api.users.getUserSettings();

      if (!res.data.error) {
        this.usersFollowed = res.data.authors;
        this.tagsFollowed = res.data.tags;
        this.bioEditInput = res.data.bio;
        this.avatarEditInput = res.data.avatar;
      }

      this.loading = false;
    },
    async editBio() {
      this.bioEditRequesting = true;

      await api.users.updateUserProfile({
        bio: this.bioEditInput,
      });

      this.bioEditRequesting = false;
    },
    async editAvatar() {
      this.avatarEditRequesting = true;

      const res = await api.users.updateUserProfile({
        avatar: this.avatarEditInput,
      });

      if (!res.data.error) {
        this.$store.commit('setAvatar', this.avatarEditInput);
        this.avatarEditInput = '';
      }

      this.avatarEditRequesting = false;
    },
    async unfollowTag(tag) {
      if (!this.requestingForUsers) {
        this.requestingForUsers = true;
        const res = await api.tags.unfollow(tag);
        if (!res.data.error) {
          this.tagsFollowed.splice(this.tagsFollowed.indexOf(tag), 1);
          this.$store.commit('unfollowTag', tag);
        }
        this.requestingForUsers = false;
      }
    },
    async unfollowUser(id) {
      if (!this.requestingForTags) {
        this.requestingForTags = true;
        const res = await api.users.unfollowUser(id);

        if (!res.data.error) {
          const foundUser = this.usersFollowed.find((el) => el.id === id);
          if (foundUser) {
            this.usersFollowed.splice(this.usersFollowed.indexOf(foundUser), 1);
          }
        }
        this.requestingForTags = false;
      }
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/mixins';
@import '@/styles/colors';

.user-settings {
  @include widget;

  @include for-size(phone-only) {
    border-left: none;
    border-right: none;
  }

  &__loading {
    display: flex;
    justify-content: center;
  }

  &__title {
    color: $main-text;
    font-size: 1.5rem;
    text-align: center;
    font-weight: 500;
    margin: 0;
  }

  &__block {
    border-bottom: 1px solid $light-gray;
    padding: 1rem 0;

    &:last-child {
      border-bottom: none;
    }
  }

  &__block-title {
    color: $main-text;
    text-align: center;
    margin: 1rem 0;
  }

  &__bio-edit {
    @include for-size(phone-only) {
      margin-left: 0;
    }

    textarea {
      resize: none;
      width: 50%;
      height: 5rem;

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
    margin-bottom: 0.5rem;
    margin-left: 1rem;

    @include for-size(phone-only) {
      margin-left: 0;
    }

    img {
      border-radius: 50%;
      border: 1px solid $light-gray;
      width: 128px;
    }
  }

  &__submit {
    @include flex-row;
  }

  &__submit-btn {
    width: 100px;
  }

  &__no-subscriptions {
    color: $main-text;
  }

  &__following {
    display: flex;
    flex-wrap: wrap;
    margin-top: 0.5rem;
    padding-left: 1rem;

    @include for-size(phone-only) {
      padding-left: 0;
    }
  }

  &__following-type {
    color: $light-gray;
    font-weight: bold;
    margin-top: 0.5rem;
  }

  &__unfollow {
    color: $error;
    font-family: monospace;
    cursor: pointer;
  }

  &__following-item {
    color: $main-text;
    margin-left: 0.5rem;
    margin-top: 0.5rem;
  }
}
</style>
