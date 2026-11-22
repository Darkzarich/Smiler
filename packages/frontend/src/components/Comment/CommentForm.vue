<template>
  <div class="comment-form">
    <BaseTextEditor
      v-model="modelValue"
      :data-testid="dataTestid"
      :placeholder="placeholder"
      :focus-on-mount="focusOnMount"
      @keydown.capture="submitOnModEnter"
    >
      <div class="comment-form__actions u-flex-row">
        <BaseButton
          class="comment-form__action-btn"
          :loading="loading"
          :data-testid="`${dataTestid}-submit-btn`"
          :title="submitHint"
          :aria-keyshortcuts="submitShortcut.aria"
          type="primary"
          @click="emit('submit')"
        >
          {{ submitLabel }}
        </BaseButton>

        <BaseButton
          class="comment-form__action-btn"
          :data-testid="`${dataTestid}-close-btn`"
          @click="emit('close')"
        >
          {{ closeLabel }}
        </BaseButton>
      </div>
    </BaseTextEditor>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { describeShortcut } from '@/utils/describe-shortcut';
import BaseButton from '@common/BaseButton.vue';
import BaseTextEditor from '@common/BaseTextEditor.vue';

const emit = defineEmits<{
  submit: [];
  close: [];
}>();

interface Props {
  dataTestid?: string;
  loading?: boolean;
  submitLabel?: string;
  closeLabel?: string;
  placeholder?: string;
  focusOnMount?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  dataTestid: '',
  loading: false,
  submitLabel: 'Send',
  closeLabel: 'Close',
  placeholder: '',
  focusOnMount: false,
});

const modelValue = defineModel<string>({
  default: '',
});

const submitShortcut = describeShortcut('Mod-Enter');

const submitHint = computed(
  () => `${props.submitLabel} (${submitShortcut.text})`,
);

const submitOnModEnter = (event: KeyboardEvent) => {
  if (
    props.loading ||
    event.key !== 'Enter' ||
    !(event.ctrlKey || event.metaKey)
  ) {
    return;
  }

  event.preventDefault();
  emit('submit');
};
</script>

<style>
.comment-form {
  &__actions {
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
