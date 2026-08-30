import { Types } from 'mongoose';

/** Fetching one document more than the page holds is what tells the client
 * whether there is a next page. It replaces a `countDocuments` over the whole
 * filter on every list request, which only gets more expensive as collections grow.
 */
export const PAGE_LOOKAHEAD = 1;

export function toPage<T>(documents: T[], limit: number) {
  return {
    items: documents.slice(0, limit),
    hasNextPage: documents.length > limit,
  };
}

const CURSOR_SEPARATOR = '|';

const OBJECT_ID_PATTERN = /^[0-9a-f]{24}$/i;

/** Points at the last document of a page as `(createdAt, _id)`. `createdAt` is
 * not unique, so `_id` breaks the ties: without it a page boundary falling in
 * the middle of a group sharing one `createdAt` would drop or repeat them. */
export interface PageCursor {
  createdAt: Date;
  id: Types.ObjectId;
}

interface CursorSource {
  createdAt: Date;
  _id: Types.ObjectId;
}

/** The cursor is opaque to clients on purpose — encoding it keeps them from
 * building one by hand and tying us to this pairing of fields. */
export function encodeCursor({ createdAt, _id }: CursorSource) {
  return Buffer.from(
    `${createdAt.toISOString()}${CURSOR_SEPARATOR}${_id.toString()}`,
  ).toString('base64url');
}

export function decodeCursor(raw: string): PageCursor | null {
  const [createdAt, id, ...rest] = Buffer.from(raw, 'base64url')
    .toString('utf8')
    .split(CURSOR_SEPARATOR);

  if (!createdAt || !id || rest.length > 0 || !OBJECT_ID_PATTERN.test(id)) {
    return null;
  }

  const parsedCreatedAt = new Date(createdAt);

  if (Number.isNaN(parsedCreatedAt.getTime())) {
    return null;
  }

  return { createdAt: parsedCreatedAt, id: new Types.ObjectId(id) };
}

/** Everything that sorts after the cursor under a `{ createdAt: -1, _id: -1 }`
 * sort. Meant to be `$and`-ed with the list's own filter. */
export function toCursorFilter({ createdAt, id }: PageCursor) {
  return {
    $or: [{ createdAt: { $lt: createdAt } }, { createdAt, _id: { $lt: id } }],
  };
}

export function toNextCursor(
  documents: CursorSource[],
  hasNextPage: boolean,
): string | null {
  const lastDocument = documents.at(-1);

  if (!hasNextPage || !lastDocument) {
    return null;
  }

  return encodeCursor(lastDocument);
}
