<template>
  <div class="user-profile">
    <div class="user-profile__avatar">
      <img :src="$resolveAvatar(user.avatar)" :alt="user.avatar" />
    </div>

    <div class="user-profile__info">
      <div class="user-profile__login" data-testid="user-profile-login">
        {{ user.login }}

        <template v-if="userAuthState && !isSameUser">
          <ButtonElement
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
          </ButtonElement>
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

      <div class="user-profile__stats">
        <div
          :class="{
            'user-profile__stat--positive': user.rating > 0,
            'user-profile__stat--negative': user.rating < 0,
          }"
          class="user-profile__stat"
          data-testid="user-profile-rating"
        >
          <span class="user-profile__stat-count">{{ user.rating }} </span>
          <span class="user-profile__stat-count-label">Rating</span>
        </div>

        <div
          class="user-profile__stat"
          data-testid="user-profile-followers-count"
        >
          <span class="user-profile__stat-count"
            >{{ user.followersAmount }}
          </span>
          <span class="user-profile__stat-count-label">Followers</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment';
import ButtonElement from '../BasicElements/ButtonElement.vue';
import api from '@/api/index';

export default {
  components: {
    ButtonElement,
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
    userAuthState() {
      return this.$store.getters.userAuthState;
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

      if (!res.user.error) {
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

      if (!res.user.error) {
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

  margin-bottom: $widget-margin;
  margin-left: 10%;
  border: 1px solid $light-gray;
  padding: 1rem;
  border-radius: 2px;
  background: $widget-bg;
  color: $main-text;
  position: relative;

  @include for-size(phone-only) {
    margin-left: 0;
    width: 100%;
    border: none;
  }

  &::after {
    content: '';
    display: inline-block;
    width: 48%;
    height: 82%;
    right: 5%;
    position: absolute;
    background-repeat: no-repeat;
    background-image: url('../../assets/neutral_avatar.png');
    opacity: 0.05;
    background-position: center;
    filter: grayscale(1);
    background-size: cover;

    @include for-size(phone-only) {
      display: none;
    }
  }

  // TODO: Move avatar to its own component
  &__avatar {
    margin-right: 1rem;

    img {
      border-radius: 50%;
      width: 7rem;
      height: 7rem;
      border: 1px solid $light-gray;
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
      padding: 4px 6px;
      width: 75px;
    }
  }

  &__login,
  &__date,
  &__bio {
    margin-bottom: 0.5rem;
  }

  &__stats {
    @include flex-row;

    gap: 2rem;
  }

  &__date {
    color: $light-gray;
  }

  &__stat-count {
    font-size: 28px;
  }

  &__stat {
    display: flex;
    flex-direction: column;
    font-size: 14px;

    &--negative .user-profile__stat-count {
      color: $dark-red;
    }

    &--positive .user-profile__stat-count {
      color: $dark-firm;
    }
  }
}
</style>
