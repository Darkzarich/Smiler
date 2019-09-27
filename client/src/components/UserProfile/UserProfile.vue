<template>
  <div class="user">
    <div class="user__offset"/>
    <div class="user__block">
      <div class="user__avatar">
        <img :src="$resolveAvatar(data.avatar)"/>
      </div>
      <div class="user__main-info">
        <div class="user__login"> {{ data.login }} </div>
        <div class="user__date"> With us already {{ data.createdAt | toDate }} </div>

        <div :class="ratingClass(data.rating)" class="user__rating">
          Rating: <span>{{ data.rating | ratingTransform }} </span>
        </div>

        <div class="user__bio" v-if="data.bio">
          Bio: {{ data.bio }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment';

export default {
  props: ['data'],
  methods: {
    ratingClass(rating) {
      if (rating > 0) {
        return 'user__rating_positive'
      } else if (rating < 0) {
        return 'user__rating_negative';
      }
      return '';
    }
  },
  filters: {
    toDate(date) {
      return moment().to(date, true);
    },
    ratingTransform(rating) {
      if (rating > 0) {
        return '+' + rating
      }
      return rating;
    }
  }
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/colors.scss';
@import '@/styles/mixins.scss';

.user {
  @include flex-row();
  justify-content: flex-end;
  margin-bottom: $widget-margin;

  &__offset {
    width: 10%;
  }

  &__block {
    @include flex-row();
    width: 90%;
    border: 1px solid $light-gray;
    padding: 1rem;
    border-radius: 2px;
    background: $widget-bg;
    color: $main-text;
  }

  .user__login,
  .user__date,
  .user__rating,
  .user__bio {
    margin-bottom: 0.5rem;
  }

  .user__date {
    color: $light-gray;
  }

  &__login {
    font-size: 1.5rem;
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
