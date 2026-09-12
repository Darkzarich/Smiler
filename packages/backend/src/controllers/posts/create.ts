import type { Request, Response } from 'express';
import slugLib from 'slug';
import { nanoid } from 'nanoid';
import { UserModel } from '@models/User';
import { PostModel, postToResponse, PostResponse } from '@models/Post';
import { sendSuccess } from '@utils/response-utils';
import {
  assertOwnUploadedPictures,
  type PostCreateBody,
} from '@validators/posts';

type CreateResponse = PostResponse;

export async function create(
  req: Request<unknown, unknown, PostCreateBody>,
  res: Response<CreateResponse>,
) {
  const { userId } = req.session;
  const { title, sections, tags } = req.body;

  assertOwnUploadedPictures(sections, userId!);

  const [post] = await Promise.all([
    PostModel.create({
      title,
      sections,
      tags,
      slug: `${slugLib(title)}-${nanoid(3)}`,
      author: userId,
    }),
    UserModel.updateOne(
      { _id: userId },
      {
        $set: {
          'template.title': '',
          'template.sections': [],
          'template.tags': [],
        },
      },
    ),
  ]);

  const populatedPost = await post.populate('author', 'login avatar');

  sendSuccess(res, postToResponse(populatedPost));
}
