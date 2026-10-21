import { describe, it, expect } from 'vitest';
import {
  countReplies,
  flattenReplies,
  insertReply,
  removeComment,
} from './thread';
import type { Comment } from './types';

function comment(
  _id: string,
  children: Comment[] = [],
  overrides: Partial<Comment> = {},
): Comment {
  return {
    _id,
    body: _id,
    author: { _id: `user-${_id}`, login: `login-${_id}`, avatar: '' },
    children,
    createdAt: '',
    updatedAt: '',
    rated: { isRated: false },
    rating: 0,
    ...overrides,
  };
}

//  A
//  ├── B
//  │   └── D
//  │       └── E
//  └── C
function thread() {
  const e = comment('E', [], { parent: 'D' });
  const d = comment('D', [e], { parent: 'B' });
  const b = comment('B', [d], { parent: 'A' });
  const c = comment('C', [], { parent: 'A' });

  return [comment('A', [b, c])];
}

describe('countReplies', () => {
  it('counts the replies on every level', () => {
    expect(countReplies(thread()[0])).toBe(4);
    expect(countReplies(comment('X'))).toBe(0);
  });
});

describe('flattenReplies', () => {
  it('lists each reply followed by its own replies, with the login it answers', () => {
    expect(
      flattenReplies(thread()[0]).map(({ comment: reply, answers }) => [
        reply._id,
        answers,
      ]),
    ).toEqual([
      ['B', 'login-A'],
      ['D', 'login-B'],
      ['E', 'login-D'],
      ['C', 'login-A'],
    ]);
  });

  it('names no login for a reply to a deleted comment', () => {
    const [a] = thread();

    a.children[0].deleted = true;

    expect(flattenReplies(a)[1]).toMatchObject({ answers: null });
  });

  it('names the comment in replyTo over the parent', () => {
    const reply = comment('F', [], {
      parent: 'A',
      replyTo: { _id: 'C', login: 'login-C' },
    });

    expect(flattenReplies(comment('A', [reply]))[0].answers).toBe('login-C');
  });
});

describe('insertReply', () => {
  it('puts a reply first under the comment it answers', () => {
    const comments = thread();

    insertReply(comments, comment('F', [], { parent: 'A' }), 'A');

    expect(comments[0].children.map(({ _id }) => _id)).toEqual(['F', 'B', 'C']);
  });

  it('puts a reply stored under an ancestor right after the branch it answers', () => {
    const comments = thread();

    insertReply(comments, comment('F', [], { parent: 'A' }), 'E');

    expect(comments[0].children.map(({ _id }) => _id)).toEqual(['B', 'F', 'C']);
  });

  it('leaves the tree alone when the parent is not in it', () => {
    const comments = thread();

    expect(insertReply(comments, comment('F', [], { parent: 'Z' }), 'Z')).toBe(
      false,
    );
    expect(countReplies(comments[0])).toBe(4);
  });
});

describe('removeComment', () => {
  it('removes a comment from wherever it is in the tree', () => {
    const comments = thread();

    expect(removeComment(comments, 'E')).toBe(true);
    expect(countReplies(comments[0])).toBe(3);
    expect(removeComment(comments, 'Z')).toBe(false);
  });
});
