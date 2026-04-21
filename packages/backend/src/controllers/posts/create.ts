import type { Request, Response } from 'express';
import slugLib from 'slug';
import { nanoid } from 'nanoid';
import { UserModel } from '@models/User';
import {
  PostModel,
  PostSection,
  postToResponse,
  PostResponse,
} from '@models/Post';
import { sendSuccess } from '@utils/response-utils';
import { PostValidator } from '@validators/PostValidator';

interface CreateBody {
  title: string;
  sections: PostSection[];
  tags?: string[];
}

type CreateResponse = PostResponse;

export async function create(
  req: Request<unknown, unknown, CreateBody>,
  res: Response<CreateResponse>,
) {
  const { userId } = req.session;

  const { title, sections, tags } = PostValidator.validateAndPrepare({
    title: req.body.title,
    sections: req.body.sections,
    tags: req.body.tags ?? [],
  });

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

  const populatedPost = await PostModel.findById(post._id)
    .populate('author', 'login avatar')
    .lean();

  sendSuccess(res, postToResponse(populatedPost!));
}
