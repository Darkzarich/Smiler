const sanitizeHtml = require('sanitize-html');

module.exports = (html = '') =>
  sanitizeHtml(html, {
    allowedTags: ['b', 'i', 's', 'u', 'cite', 'br'],
    allowedAttributes: {},
  });
