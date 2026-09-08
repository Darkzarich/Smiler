import { postTypes } from '@/api/posts';

interface BuildPreviewPostParams {
  title: string;
  tags: string[];
  sections: postTypes.PostSection[];
  author: postTypes.Post['author'] | null;
}

const PREVIEW_ID = 'preview';

/** Stands in for the fields the server assigns, so a draft can be rendered by
 * Post.vue. Only safe because the preview renders with `interactive` off. */
export function buildPreviewPost({
  title,
  tags,
  sections,
  author,
}: BuildPreviewPostParams): postTypes.Post {
  const now = new Date().toISOString();

  return {
    _id: PREVIEW_ID,
    slug: PREVIEW_ID,
    title: title.trim() || 'Untitled post',
    tags,
    sections,
    author: author ?? { _id: PREVIEW_ID, login: 'Anonymous', avatar: '' },
    commentCount: 0,
    rating: 0,
    rated: { isRated: false },
    createdAt: now,
    updatedAt: now,
  };
}
