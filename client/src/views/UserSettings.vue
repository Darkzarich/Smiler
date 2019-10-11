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
              class="user-settings__data-group-author"
              v-for="author in usersFollowed"
              :key="author.id"
            >
              {{ author.login }}
              <span @click="unfollow(author.id)" class="user-settings__data-group-unfollow">
              x
              </span>
            </div>
          </div>
          <div v-if="tagsFollowed.length > 0" class="user-settings__data-group">
            <div class="user-settings__data-group-title">
              Tags:
            </div>
            <div
              class="user-settings__data-group-tag"
              v-for="tag in tagsFollowed"
              :key="tag"
            >
              {{ tag }}
              <span @click="unfollowTag(tag)" class="user-settings__data-group-unfollow">
                x
              </span>
            </div>
          </div>
          <div class="user-settings__data-group" v-if="usersFollowed.length === 0 && tagsFollowed.length === 0">
            <i>Nothing in following...</i>
          </div>
      </div>
    </div>
    <div v-else class="user-settings__loading">
      <loader/>
    </div>
  </div>
</template>

<script>
import api from '@/api';
import loader from '@/library/svg/animation/circularLoader';
import { mapState } from 'vuex';

export default {
  components: {
    loader
  },
  data() {
    return {
      usersFollowed: [],
      tagsFollowed: [],
      loading: true,
      requestingForTags: false,
      requestingForUsers: false,
    };
  },
  computed: {
    ...mapState({
      login: state => state.user.login,
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
          const foundUser = this.usersFollowed.find(el => el.id === id);
          if (foundUser) {
            this.usersFollowed.splice(this.usersFollowed.indexOf(foundUser), 1);
          }
        }
        this.requestingForTags = false;
      }
    },
  },
}
</script>

<style lang="scss">
@import '@/styles/mixins';
@import '@/styles/colors';

.user-settings {
  @include widget;
  &__loading {
    display: flex;
    justify-content: center;
  }
  &__data-group-unfollow {
      color: $error;
      font-family: monospace;
      cursor: pointer;
  }

  &__data-title {
      font-size: 1.5rem;
      color: $main-text;
      text-align: center;
  }

  &__data-group {
      display: flex;
      flex-wrap: wrap;
      margin-top: 0.5rem;
      padding-left: 1rem;
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
