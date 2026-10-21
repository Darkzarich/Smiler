import type { InjectionKey } from 'vue';
import type { Comment } from './types';

export interface FlatReply {
  comment: Comment;
  /** Shown as "↳ @login"; null once the comment answered is deleted */
  answers: string | null;
}

export interface CommentThread {
  addReply: (reply: Comment, answeredId: string) => void;
  remove: (id: string) => void;
}

export const commentThreadKey: InjectionKey<CommentThread> =
  Symbol('commentThread');

export function countReplies(comment: Comment): number {
  return comment.children.reduce(
    (count, child) => count + 1 + countReplies(child),
    0,
  );
}

/** The login a reply answers: its parent's, unless the server stored it next
 * to the comment it answers, which is then in `replyTo`. */
export function answeredLogin(reply: Comment, parent: Comment) {
  if (reply.replyTo) {
    return reply.replyTo.login;
  }

  return parent.deleted ? null : parent.author.login;
}

/** Every reply under `comment`, each one followed by its own replies */
export function flattenReplies(comment: Comment): FlatReply[] {
  return comment.children.flatMap((child) => [
    { comment: child, answers: answeredLogin(child, comment) },
    ...flattenReplies(child),
  ]);
}

function contains(comment: Comment, id: string): boolean {
  return (
    comment._id === id || comment.children.some((child) => contains(child, id))
  );
}

export function findComment(
  comments: Comment[],
  id: string,
): Comment | undefined {
  for (const comment of comments) {
    if (comment._id === id) {
      return comment;
    }

    const found = findComment(comment.children, id);

    if (found) {
      return found;
    }
  }

  return undefined;
}

/** Puts a new reply under the parent the server stored it under, right below
 * the comment it answers: first among the parent's replies when that is the
 * parent itself, or else after the branch holding it. */
export function insertReply(
  comments: Comment[],
  reply: Comment,
  answeredId: string,
) {
  const parent = reply.parent ? findComment(comments, reply.parent) : undefined;

  if (!parent) {
    return false;
  }

  const branch = parent.children.findIndex((child) =>
    contains(child, answeredId),
  );

  parent.children.splice(branch + 1, 0, reply);

  return true;
}

export function removeComment(comments: Comment[], id: string): boolean {
  const index = comments.findIndex((comment) => comment._id === id);

  if (index !== -1) {
    comments.splice(index, 1);

    return true;
  }

  return comments.some((comment) => removeComment(comment.children, id));
}
