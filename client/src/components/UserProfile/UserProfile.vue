<template>
  <div class="user-profile">
    <div class="user-profile__offset" />
    <div class="user-profile__block">
      <div class="user-profile__avatar">
        <img :src="$resolveAvatar(data.avatar)" :alt="data.avatar" />
      </div>
      <div class="user-profile__main-info">
        <div class="user-profile__login">
          {{ data.login }}
          <template v-if="(!isFollowed && data.login !== user.login) || !user.authState">
            <button-element
              :disabled="!user.authState"
              :loading="requesting"
              :callback="follow"
            >
              Follow
            </button-element>
          </template>
          <template v-else-if="data.login !== user.login">
            <button-element
              :loading="requesting"
              :callback="unfollow"
            >
              Unfollow
            </button-element>
          </template>
        </div>
        <div class="user-profile__date"> With us already {{ data.createdAt | toDate }} </div>

        <div class="user-profile__main-info-row">
          <div :class="ratingClass(data.rating)" class="user-profile__rating">
            Rating: <span>{{ data.rating | ratingTransform }} </span>
          </div>
          <div class="user-profile__followers">
            Followers: <span>{{ data.followersAmount }} </span>
          </div>
        </div>

        <div class="user-profile__bio" v-if="data.bio">
          Bio: <i>{{ data.bio }}</i>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment';
import { mapState } from 'vuex';

import api from '@/api/index';

import ButtonElement from '../BasicElements/ButtonElement.vue';

export default {
  components: {
    ButtonElement,
  },
  computed: {
    ...mapState({
      user: (state) => state.user,
    }),
    isFollowed() {
      return this.data.isFollowed;
    },
  },
  props: ['data'],
  data() {
    return {
      requesting: false,
    };
  },
  methods: {
    ratingClass(rating) {
      if (rating > 0) {
        return 'user-profile__rating_positive';
      } if (rating < 0) {
        return 'user-profile__rating_negative';
      }
      return '';
    },
    async follow() {
      if (!this.requesting) {
        this.requesting = true;
        const res = await api.users.followUser(this.data.id);

        if (!res.data.error) {
          this.data.followersAmount = this.data.followersAmount + 1;
          this.data.isFollowed = true;
        }
        this.requesting = false;
      }
    },
    async unfollow() {
      if (!this.requesting) {
        this.requesting = true;
        const res = await api.users.unfollowUser(this.data.id);

        if (!res.data.error) {
          this.data.followersAmount = this.data.followersAmount - 1;
          this.data.isFollowed = false;
        }
        this.requesting = false;
      }
    },
  },
  filters: {
    toDate(date) {
      return moment().to(date, true);
    },
    ratingTransform(rating) {
      if (rating > 0) {
        return `+${rating}`;
      }
      return rating;
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/colors.scss';
@import '@/styles/mixins.scss';

.user-profile {
  @include flex-row();
  justify-content: flex-end;
  margin-bottom: $widget-margin;

  &__offset {
    width: 10%;
    @include for-size(phone-only) {
      display: none;
    }
  }

  &__block {
    @include flex-row();
    width: 90%;
    border: 1px solid $light-gray;
    padding: 1rem;
    border-radius: 2px;
    background: $widget-bg;
    color: $main-text;
    &:after {
      content: '';
      display: inline-block;
      width: 50%;
      height: 100%;
      position: relative;
      background-repeat: no-repeat;
      background-image: url('../../assets/neutral_avatar.png');
      opacity: 0.1;
      background-position: center;
      filter: grayscale(1);
      background-size: cover;
    }
    @include for-size(phone-only) {
      width: 100%;
      border: none;
      &:after {
        display: none;
      }
    }
  }

  &__login,
  &__date,
  &__rating,
  &__bio {
    margin-bottom: 0.5rem;
  }

  &__main-info-row {
    @include flex-row();
  }

  &__followers {
    margin-left: 1rem;
  }

  .user-profile__date {
    color: $light-gray;
  }

  &__login {
    font-size: 1.5rem;
    @include flex-row();
    .button {
      margin: 0;
      margin-left: 1rem;
      &__element {
        padding: 1px 6px;
      }
    }
  }

  &__rating {
    &_negative span {
      color: $dark-red;
    }
    &_positive span {
      color: $dark-firm;
    }
  }

  &__avatar {
    margin-right: 1rem;
    img {
      border-radius: 50%;
      width: 7rem;
      height: 7rem;
    }
  }
}
</style>
