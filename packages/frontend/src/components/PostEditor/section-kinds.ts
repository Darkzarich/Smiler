import type { Component } from 'vue';
import { postTypes } from '@/api/posts';
import IconPicture from '@icons/IconPicture.vue';
import IconText from '@icons/IconText.vue';
import IconVideo from '@icons/IconVideo.vue';

/** What each section's header and its add button call it */
export const sectionKinds: Record<
  postTypes.POST_SECTION_TYPES,
  { label: string; icon: Component }
> = {
  [postTypes.POST_SECTION_TYPES.TEXT]: { label: 'Text', icon: IconText },
  [postTypes.POST_SECTION_TYPES.PICTURE]: {
    label: 'Picture',
    icon: IconPicture,
  },
  [postTypes.POST_SECTION_TYPES.VIDEO]: { label: 'Video', icon: IconVideo },
};
