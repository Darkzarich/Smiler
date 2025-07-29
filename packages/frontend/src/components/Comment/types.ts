import type { commentTypes } from '@/api/comments';

export interface Comment extends commentTypes.Comment {
  /** State for CSS animation for a newly created comment */
  created?: boolean;
}
