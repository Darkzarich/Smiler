<template>
  <div class="user-settings">
    <div v-if="!loading" class="user-settings__data">
      <div class="user-settings__block">
        <div class="user-settings__data-title">
          Following
        </div>
        <div v-if="usersFollowed.length > 0" class="user-settings__data-group">
          <div class="user-settings__data-group-title">
            Authors:
          </div>
          <div
            v-for="author in usersFollowed"
            :key="author.id"
            class="user-settings__data-group-author"
          >
            {{ author.login }}
            <span class="user-settings__data-group-unfollow" @click="unfollow(author.id)">
              x
            </span>
          </div>
        </div>
        <div v-if="tagsFollowed.length > 0" class="user-settings__data-group">
          <div class="user-settings__data-group-title">
            Tags:
          </div>
          <div
            v-for="tag in tagsFollowed"
            :key="tag"
            class="user-settings__data-group-tag"
          >
            {{ tag }}
            <span class="user-settings__data-group-unfollow" @click="unfollowTag(tag)">
              x
            </span>
          </div>
        </div>
        <div
          v-if="usersFollowed.length === 0 && tagsFollowed.length === 0"
          class="user-settings__data-group"
        >
          <i>Nothing in following...</i>
        </div>
      </div>
      <div class="user-settings__block">
        <div class="user-settings__data-title">
          Edit Bio
        </div>
        <InputElement
          v-model="bioEditInput"
          class="user-settings__bio-edit"
          :multiline="true"
        />
        <div class="user-settings__bio-buttons">
          <ButtonElement
            :loading="bioEditRequesting"
            :callback="editBio"
            :disabled="bioEditInput.length > USER_MAX_BIO_LENGTH"
          >
            Submit
          </ButtonElement>
        </div>
      </div>
      <div class="user-settings__block">
        <div class="user-settings__data-title">
          Edit Avatar
        </div>
        <div class="user-settings__current-avatar">
          <img :src="$resolveAvatar(avatar)" :alt="avatar">
        </div>
        <InputElement
          v-model="avatarEditInput"
          class="user-settings__avatar-edit"
          placeholder="URL to avatar..."
        />
        <div class="user-settings__bio-buttons">
          <ButtonElement
            :loading="avatarEditRequesting"
            :callback="editAvatar"
            :disabled="bioEditInput.length > USER_MAX_AVATAR_LENGTH"
          >
            Submit
          </ButtonElement>
        </div>
      </div>
    </div>
    <!-- TODO: rated list -->
    <div v-else class="user-settings__loading">
      <CircularLoader />
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
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
    ...mapState({
      login: (state) => state.user.login,
      avatar: (state) => state.user.avatar,
    }),
  },
  created() {
    this.getData();
  },
  methods: {
    async getData() {
      this.loading = true;
      const res = await api.users.getUsersFollowing(this.login);

      if (!res.data.error) {
        this.usersFollowed = res.data.authors;
        this.tagsFollowed = res.data.tags;
      }
      this.loading = false;
    },
    async editBio() {
      this.bioEditRequesting = true;
      await api.users.updateUserProfile(this.login, {
        bio: this.bioEditInput,
      });
      this.bioEditRequesting = false;
    },
    async editAvatar() {
      this.avatarEditRequesting = true;
      const res = await api.users.updateUserProfile(this.login, {
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
    async unfollow(id) {
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
  &__data-group-unfollow {
      color: $error;
      font-family: monospace;
      cursor: pointer;
  }

  &__bio-buttons {
    @include flex-row();
    .button {
      width: 20%;
    }
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
    border: 1px solid $light-gray;
    margin-bottom: 0.5rem;
    margin-left: 1rem;
    @include for-size(phone-only) {
      margin-left: 0;
    }
    img {
      border-radius: 50%;
      width: 8rem;
    }
  }

  &__data-title {
      font-size: 1.5rem;
      color: $main-text;
      text-align: center;
      margin-top: 1.5rem;
      margin-bottom: 1rem;
  }

  &__data-group {
      display: flex;
      flex-wrap: wrap;
      margin-top: 0.5rem;
      padding-left: 1rem;
      @include for-size(phone-only) {
        padding-left: 0;
      }
      i {
        color: $main-text;
      }
  }

  &__data-group-title {
      color: $light-gray;
      font-weight: bold;
      margin-top: 0.5rem;
  }

  &__data-group-tag,
  &__data-group-author {
      color: $main-text;
      margin-left: 0.5rem;
      margin-top: 0.5rem;
  }
}

</style>
