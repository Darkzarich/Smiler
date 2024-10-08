<template>
  <PostsContainer
    :posts="posts"
    :is-loading="isLoading"
    :has-next-page="hasNextPage"
    @fetch-more="handleNextPage"
  >
    <template #no-content>
      No content found at the moment. <br />
      Please check back later for updates. <br />
      Thank you.
    </template>

    <template #no-more-content>
      Thank you for exploring all available content in this category. <br />
      Please check back later for more updates.
    </template>
  </PostsContainer>
</template>

<script>
import api from '@/api';
import PostsContainer from '@/components/PostsContainer/PostsContainer.vue';
import consts from '@/const/const';

export default {
  components: {
    PostsContainer,
  },
  data() {
    return {
      isLoading: false,
      posts: [],
      curPage: 0,
      hasNextPage: false,
    };
  },
  watch: {
    '$route.name': function () {
      this.posts = [];
      this.isLoading = false;
      this.curPage = 0;
      this.hasNextPage = false;
      this.fetchPosts();
    },
  },
  created() {
    this.fetchPosts();
  },
  methods: {
    /**
     *
     * @param {Object} options
     * @param {boolean=} options.isCombine - if true, posts are concatenated to the existing array
     */
    async fetchPosts({ isCombine } = {}) {
      const pageRequestsMap = {
        Home: api.posts.getToday,
        All: api.posts.getAll,
        Blowing: api.posts.getBlowing,
        TopThisWeek: api.posts.getTopThisWeek,
        New: api.posts.getRecent,
        Feed: api.posts.getFeed,
      };

      if (!pageRequestsMap[this.$route.name]) {
        return;
      }

      this.isLoading = true;

      const res = await pageRequestsMap[this.$route.name]({
        limit: consts.POSTS_INITIAL_COUNT,
        offset: this.curPage * consts.POSTS_INITIAL_COUNT,
      });

      if (res && !res.data.error) {
        this.hasNextPage = res.data.hasNextPage;

        if (isCombine) {
          this.posts = this.posts.concat(res.data.posts);
        } else {
          this.posts = res.data.posts;
        }
      }

      this.isLoading = false;
    },
    handleNextPage() {
      this.curPage = this.curPage + 1;
      this.fetchPosts({ isCombine: true });
    },
  },
};
</script>
