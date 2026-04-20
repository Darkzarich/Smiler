import type { Request, Response } from 'express';
import { UserModel } from '@models/User';
import { PostModel, postToResponse, PostResponse } from '@models/Post';
import { RateModel, RateTargetModel } from '@models/Rate';
import { NotFoundError, ERRORS } from '@errors';
import { sendSuccess } from '@utils/response-utils';
import { POST_MAX_LIMIT } from '@constants/index';
import { PaginationValidator } from '@validators/PaginationValidator';
import { PaginationRequest, PaginationResponse } from '@type/pagination';

interface GetListByAuthorQuery extends PaginationRequest {
  author: string;
}

interface GetListByAuthorResponse extends PaginationResponse {
  posts: PostResponse[];
}

export async function getListByAuthor(
  req: Request<unknown, unknown, unknown, GetListByAuthorQuery>,
  res: Response<GetListByAuthorResponse>,
) {
  const { userId } = req.session;

  const { limit, offset } = PaginationValidator.validate(req.query, {
    maxLimit: POST_MAX_LIMIT,
  });
  const author = req.query.author || '';

  const foundAuthor = await UserModel.findOne({
    login: author,
  }).lean();

  if (!foundAuthor) {
    throw new NotFoundError(ERRORS.AUTHOR_NOT_FOUND);
  }

  const query = {
    author: foundAuthor._id,
  };

  const [posts, total] = await Promise.all([
    PostModel.find(query)
      .sort({ createdAt: -1 })
      .populate('author', 'login avatar')
      .limit(limit)
      .skip(offset)
      .lean(),
    PostModel.countDocuments(query),
  ]);

  const ratedTargets = await RateModel.findRatedTargets({
    userId,
    targetIds: posts.map((post) => post._id.toString()),
    targetModel: RateTargetModel.POST,
  });

  const postsWithRated = posts.map((post) =>
    postToResponse(post, ratedTargets),
  );

  sendSuccess(res, {
    posts: postsWithRated,
    total,
    pages: Math.ceil(total / limit),
    hasNextPage: offset + limit < total,
  });
}
