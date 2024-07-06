<template>
  <div></div>
</template>

<script>
import api from '@/api';
import consts from '@/const/const';

export default {
  props: {
    comment: {
      type: Object,
      default: () => {},
    },
  },
  methods: {
    async upvote(id) {
      if (!this.loadingRate) {
        const commentItemData = this.comment.find((el) => el.id === id);

        this.loadingRate = true;

        if (!commentItemData.rated.isRated) {
          commentItemData.rated.isRated = true;
          commentItemData.rated.negative = false;
          commentItemData.rating =
            commentItemData.rating + consts.COMMENT_RATE_VALUE;

          const res = await api.comments.updateRate(id, {
            negative: false,
          });

          if (res.data.error) {
            commentItemData.rated.isRated = false;
            commentItemData.rating =
              commentItemData.rating - consts.COMMENT_RATE_VALUE;
          }
        } else if (commentItemData.rated.negative) {
          commentItemData.rated.isRated = false;
          commentItemData.rating =
            commentItemData.rating + consts.COMMENT_RATE_VALUE;

          const res = await api.comments.removeRate(id);

          if (res.data.error) {
            commentItemData.rated.isRated = true;
            commentItemData.rating =
              commentItemData.rating - consts.COMMENT_RATE_VALUE;
          }
        }
      }

      this.loadingRate = false;
    },
    async downvote(id) {
      if (!this.loadingRate) {
        const commentItemData = this.comment.find((el) => el.id === id);

        this.loadingRate = true;

        if (!commentItemData.rated.isRated) {
          commentItemData.rated.isRated = true;
          commentItemData.rated.negative = true;
          commentItemData.rating =
            commentItemData.rating - consts.COMMENT_RATE_VALUE;

          const res = await api.comments.updateRate(id, {
            negative: true,
          });

          if (res.data.error) {
            commentItemData.rated.isRated = false;
            commentItemData.rating =
              commentItemData.rating + consts.COMMENT_RATE_VALUE;
          }
        } else if (!commentItemData.rated.negative) {
          commentItemData.rated.isRated = false;
          commentItemData.rating =
            commentItemData.rating - consts.COMMENT_RATE_VALUE;

          const res = await api.comments.removeRate(id);

          if (res.data.error) {
            commentItemData.rated.isRated = true;
            commentItemData.rating =
              commentItemData.rating + consts.COMMENT_RATE_VALUE;
          }
        }
      }

      this.loadingRate = false;
    },
  },
};
</script>

<style lang="scss">
.comment {
}
</style>
