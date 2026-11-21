<template>
  <time v-if="dateValue" :datetime="dateValue.toISOString()" :title="exactDate">
    {{ relative }}
  </time>
</template>

<script setup lang="ts">
import { useNow } from '@vueuse/core';
import { format, isValid } from 'date-fns';
import { computed } from 'vue';
import { formatFromNow } from '@/utils/format-from-now';

interface Props {
  date: Date | string | number;
}

const props = defineProps<Props>();

/** A minute is the smallest step the text can take, and a page left open must
 * not keep saying "1 minute ago". */
const now = useNow({ interval: 60_000 });

const dateValue = computed(() => {
  if (!props.date) {
    return null;
  }

  const date = new Date(props.date);

  return isValid(date) ? date : null;
});

const relative = computed(() =>
  dateValue.value ? formatFromNow(dateValue.value, now.value) : '',
);

/** The exact moment, as the tooltip: a relative text alone cannot say which day it was. */
const exactDate = computed(() =>
  dateValue.value ? format(dateValue.value, 'PPp') : '',
);
</script>
