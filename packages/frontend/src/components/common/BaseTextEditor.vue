<template>
  <AsyncTextEditor :id="id" v-model="textEditorValue" :data-testid="dataTestid">
    <slot />
  </AsyncTextEditor>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue';

interface Props {
  dataTestid?: string;
  id?: string;
}

withDefaults(defineProps<Props>(), {
  dataTestid: 'input',
  id: undefined,
});

const textEditorValue = defineModel<string>({
  default: '',
});

const AsyncTextEditor = defineAsyncComponent(
  () => import('./BaseTiptapTextEditor.vue'),
);
</script>
