<template>
  <div class="user-profile">
    <div class="user-profile__avatar">
      <img :src="$resolveAvatar(user.avatar)" :alt="user.avatar" />
    </div>

    <div class="user-profile__info">
      <div class="user-profile__login" data-testid="user-profile-login">
        {{ user.login }}

        <template v-if="isUserAuth && !isSameUser">
          <BaseButton
            class="user-profile__follow-btn"
            :data-testid="
              isFollowed
                ? 'user-profile-unfollow-btn'
                : 'user-profile-follow-btn'
            "
            :loading="requesting"
            :callback="handleFollow"
          >
            {{ isFollowed ? 'Unfollow' : 'Follow' }}
          </BaseButton>
        </template>
      </div>

      <div class="user-profile__date">
        With us already {{ user.createdAt | toDate }}
      </div>

      <div
        v-if="user.bio"
        class="user-profile__bio"
        data-testid="user-profile-bio"
      >
        <i>{{ user.bio }}</i>
      </div>

      <UserStats :user="user" />
    </div>
  </div>
</template>

<script>
import moment from 'moment';
import api from '@/api/index';
import BaseButton from '@common/BaseButton.vue';
import UserStats from '@components/User/UserStats.vue';

export default {
  components: {
    BaseButton,
    UserStats,
  },
  filters: {
    toDate(date) {
      return moment().to(date, true);
    },
  },
  props: {
    user: {
      type: Object,
      required: true,
      default: () => ({}),
    },
  },
  data() {
    return {
      requesting: false,
    };
  },
  computed: {
    isUserAuth() {
      return this.$store.getters.isUserAuth;
    },
    isFollowed() {
      return this.user.isFollowed;
    },
    isSameUser() {
      // TODO: Find all these check and change them to comparing user id not login
      return this.$store.state.user.login === this.user.login;
    },
  },
  methods: {
    async follow() {
      if (this.requesting) {
        return;
      }

      this.requesting = true;

      const res = await api.users.followUser(this.user.id);

      if (!res.data.error) {
        this.user.followersAmount = this.user.followersAmount + 1;
        this.user.isFollowed = true;
      }

      this.requesting = false;
    },
    async unfollow() {
      if (this.requesting) {
        return;
      }

      this.requesting = true;

      const res = await api.users.unfollowUser(this.user.id);

      if (!res.data.error) {
        this.user.followersAmount = this.user.followersAmount - 1;
        this.user.isFollowed = false;
      }

      this.requesting = false;
    },
    async handleFollow() {
      if (this.isFollowed) {
        await this.unfollow();
      } else {
        await this.follow();
      }
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/variables';
@import '@/styles/colors';
@import '@/styles/mixins';

.user-profile {
  @include flex-row;

  position: relative;
  margin-bottom: $widget-margin;
  margin-left: 10%;
  padding: 1rem;
  border: 1px solid $light-gray;
  border-radius: 2px;
  background: $widget-bg;
  color: $main-text;

  @include for-size(phone-only) {
    width: 100%;
    margin-left: 0;
    border: none;
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

    @include for-size(phone-only) {
      display: none;
    }
  }

  // TODO: Move avatar to its own component
  &__avatar {
    margin-right: 1rem;

    img {
      width: 7rem;
      height: 7rem;
      border: 1px solid $light-gray;
      border-radius: 50%;
    }
  }

  &__login {
    @include flex-row;

    font-size: 1.5rem;
  }

  &__follow-btn {
    margin: 0;
    margin-left: 1rem;
    font-size: 13px;

    .button__element {
      width: 75px;
      padding: 4px 6px;
    }
  }

  &__login,
  &__date,
  &__bio {
    margin-bottom: 0.5rem;
  }

  &__date {
    color: $light-gray;
  }
}
</style>
