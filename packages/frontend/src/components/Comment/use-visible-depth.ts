import { computed } from 'vue';
import { COMMENT_VISIBLE_DEPTH } from '@/const';
import { useMediaQuery } from '@/composables/use-media-query';

export function useVisibleDepth() {
  const isPhone = useMediaQuery('phone-only');
  const isDesktop = useMediaQuery('desktop-up');

  return computed(() => {
    if (isPhone.value) {
      return COMMENT_VISIBLE_DEPTH.phone;
    }

    return isDesktop.value
      ? COMMENT_VISIBLE_DEPTH.desktop
      : COMMENT_VISIBLE_DEPTH.tablet;
  });
}
