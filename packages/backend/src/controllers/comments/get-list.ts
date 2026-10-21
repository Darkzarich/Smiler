import type { Request, Response } from 'express';
import type { Types } from 'mongoose';
import {
  CommentModel,
  LeanComment,
  commentToResponse,
  CommentResponse,
} from '@models/Comment';
import { UserModel, type PopulatedAuthor } from '@models/User';
import { RateModel, RateTargetModel, type RatedTargets } from '@models/Rate';
import { NotFoundError, ERRORS } from '@errors';
import { sendSuccess } from '@utils/response-utils';
import { PaginationResponse } from '@type/pagination';
import { PAGE_LOOKAHEAD, toPage } from '@utils/pagination';
import type { CommentListQuery } from '@validators/comments';

interface GetListResponse extends PaginationResponse {
  comments: CommentResponse[];
}

/** One round trip however deep the threads go: populating `children` level by
 * level took two queries per level, and stopped at 20 levels. */
async function findReplies(rootIds: Types.ObjectId[]) {
  if (rootIds.length === 0) {
    return [];
  }

  const replies = await CommentModel.aggregate<LeanComment>([
    { $match: { _id: { $in: rootIds } } },
    {
      $graphLookup: {
        from: CommentModel.collection.name,
        startWith: '$_id',
        connectFromField: '_id',
        connectToField: 'parent',
        as: 'reply',
      },
    },
    { $unwind: '$reply' },
    { $replaceRoot: { newRoot: '$reply' } },
    { $project: { children: 0 } },
  ]);

  // The order they were pushed onto `children` in: an id starts with its creation time
  return replies.sort((a, b) =>
    a._id.toString().localeCompare(b._id.toString()),
  );
}

async function findAuthors(comments: LeanComment[]) {
  const authorIds = comments
    .filter((comment) => !comment.deleted)
    .map((comment) => comment.author);

  const authors = await UserModel.find({ _id: { $in: authorIds } })
    .select({ login: 1, avatar: 1 })
    .lean<PopulatedAuthor[]>();

  return new Map(authors.map((author) => [author._id.toString(), author]));
}

function buildTree({
  roots,
  replies,
  authors,
  ratedTargets,
}: {
  roots: LeanComment[];
  replies: LeanComment[];
  authors: Map<string, PopulatedAuthor>;
  ratedTargets?: RatedTargets;
}) {
  const nodes = new Map<string, CommentResponse>();

  for (const comment of [...roots, ...replies]) {
    nodes.set(comment._id.toString(), {
      ...commentToResponse(
        {
          ...comment,
          author: authors.get(comment.author.toString()) ?? comment.author,
        },
        ratedTargets,
      ),
      children: [],
    });
  }

  for (const reply of replies) {
    nodes
      .get(reply.parent!.toString())
      ?.children.push(nodes.get(reply._id.toString())!);
  }

  return roots.map((root) => nodes.get(root._id.toString())!);
}

export async function getList(
  req: Request<unknown, unknown, unknown, CommentListQuery>,
  res: Response<GetListResponse>,
) {
  const { userId } = req.session;
  const { post, author, limit, offset } = req.query;

  const query: {
    parent: { $exists: false };
    post: string;
    author?: string;
  } = {
    parent: { $exists: false },
    post,
  };

  if (author) {
    const foundAuthor = await UserModel.findById(author).lean();

    if (!foundAuthor) {
      throw new NotFoundError(ERRORS.AUTHOR_NOT_FOUND);
    }

    query.author = foundAuthor._id.toString();
  }

  const foundRoots = await CommentModel.find(query)
    .select({ children: 0 })
    .sort({ rating: -1 })
    .skip(offset)
    .limit(limit + PAGE_LOOKAHEAD)
    .lean<LeanComment[]>();

  const { items: roots, hasNextPage } = toPage(foundRoots, limit);

  const replies = await findReplies(roots.map((root) => root._id));

  const comments = [...roots, ...replies];

  const [authors, ratedTargets] = await Promise.all([
    findAuthors(comments),
    RateModel.findRatedTargets({
      userId,
      targetIds: comments.map((comment) => comment._id.toString()),
      targetModel: RateTargetModel.COMMENT,
    }),
  ]);

  sendSuccess(res, {
    comments: buildTree({ roots, replies, authors, ratedTargets }),
    hasNextPage,
  });
}
