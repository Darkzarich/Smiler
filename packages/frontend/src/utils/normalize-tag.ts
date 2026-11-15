/** The backend's spelling of a tag (`normalizeTag` in its posts validator),
 * so the editor shows and compares the tags the post will end up with. */
export function normalizeTag(tag: string) {
  return tag
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, '')
    .replace(/\s+/g, ' ');
}
