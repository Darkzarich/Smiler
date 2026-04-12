import sanitizeHtml from 'sanitize-html';

export enum SanitizeHtmlProfile {
  Comment = 'comment',
  Post = 'post',
}

const commonAllowedTags = [
  'a',
  'b',
  'blockquote',
  'br',
  'cite',
  'code',
  'i',
  'li',
  'ol',
  'p',
  's',
  'u',
  'ul',
];

const postAllowedTags = [
  ...commonAllowedTags,
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
];

const transformTags = {
  strong: 'b',
  em: 'i',
  strike: 's',
  del: 's',
  ins: 'u',
} as const;

const sanitizeAppHtml = (
  html = '',
  profile: SanitizeHtmlProfile = SanitizeHtmlProfile.Comment,
) =>
  sanitizeHtml(html, {
    allowedTags:
      profile === SanitizeHtmlProfile.Post
        ? postAllowedTags
        : commonAllowedTags,
    allowedAttributes: {
      a: ['href', 'rel', 'target'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags,
  });

export const hasSanitizedHtmlContent = (
  html: string,
  { allowHorizontalRule = false }: { allowHorizontalRule?: boolean } = {},
) => {
  const text = sanitizeHtml(html, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/\u00a0/g, ' ')
    .trim();

  return Boolean(text || (allowHorizontalRule && html.includes('<hr')));
};

export default sanitizeAppHtml;
