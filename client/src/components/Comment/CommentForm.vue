<template>
  <div class="comment-form">
    <BaseTextEditor
      :data-testid="dataTestid"
      :value="value"
      @input="$emit('input', $event)"
    >
      <div class="comment-form__actions">
        <BaseButton
          class="comment-form__action-btn"
          :loading="loading"
          :data-testid="`${dataTestid}-submit-btn`"
          @click.native="$emit('submit')"
        >
          Send
        </BaseButton>

        <BaseButton
          class="comment-form__action-btn"
          :data-testid="`${dataTestid}-close-btn`"
          @click.native="$emit('close')"
        >
          Close
        </BaseButton>
      </div>
    </BaseTextEditor>
  </div>
</template>

<script>
import BaseButton from '@common/BaseButton.vue';
import BaseTextEditor from '@common/BaseTextEditor.vue';

export default {
  components: {
    BaseButton,
    BaseTextEditor,
  },
  props: {
    dataTestid: {
      type: String,
      default: '',
    },
    value: {
      type: String,
      default: '',
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/mixins';

.comment-form {
  &__actions {
    @include flex-row;

    gap: 16px;
    margin-top: 20px;
  }

  &__action-btn {
    width: 140px;
  }

  .base-text-editor__contenteditable {
    min-height: 6rem;
  }
}
</style>
