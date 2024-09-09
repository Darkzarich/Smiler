import sanitizeHtml from 'sanitize-html';

export default (html = '') =>
  sanitizeHtml(html, {
    allowedTags: ['b', 'i', 's', 'u', 'cite', 'br'],
    allowedAttributes: {},
  });
