<template>
  <div class="user">
    <div class="user__offset"/>
    <div class="user__block">
      <div class="user__avatar">
        <img :src="$resolveAvatar(data.avatar)"/>
      </div>
      <div class="user__main-info">
        <div class="user__login"> {{ data.login }} </div>
        <div> Rating: {{ data.rating }} </div>
        <div> Bio: {{ data.bio }} </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ['data']
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

  &__login {
    font-size: 1.5rem;
  }

  &__avatar {
    margin-right: 1rem;
    img {
      border-radius: 50%;
    }
  }
}
</style>
