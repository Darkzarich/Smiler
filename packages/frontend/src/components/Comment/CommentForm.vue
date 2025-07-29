<template>
  <div class="comment-form">
    <BaseTextEditor
      :model-value="modelValue"
      :data-testid="dataTestid"
      @update:model-value="modelValue = $event"
    >
      <div class="comment-form__actions">
        <BaseButton
          class="comment-form__action-btn"
          :loading="loading"
          :data-testid="`${dataTestid}-submit-btn`"
          @click="$emit('submit')"
        >
          Send
        </BaseButton>

        <BaseButton
          class="comment-form__action-btn"
          :data-testid="`${dataTestid}-close-btn`"
          @click="$emit('close')"
        >
          Close
        </BaseButton>
      </div>
    </BaseTextEditor>
  </div>
</template>

<script setup lang="ts">
import BaseButton from '@common/BaseButton.vue';
import BaseTextEditor from '@common/BaseTextEditor.vue';

defineEmits<{
  submit: [];
  close: [];
}>();

interface Props {
  dataTestid?: string;
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  dataTestid: '',
  loading: false,
});

const modelValue = defineModel<string>({
  default: '',
});
</script>

<style lang="scss">
@use '@/styles/mixins';

.comment-form {
  &__actions {
    @include mixins.flex-row;

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
