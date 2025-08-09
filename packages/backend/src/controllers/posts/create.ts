import type { Request, Response } from 'express';
import slugLib from 'slug';
import crypto from 'node:crypto';
import { UserModel } from '@models/User';
import { Post, PostModel, PostSection } from '@models/Post';
import { sendSuccess } from '@utils/response-utils';
import { PostValidator } from '@validators/PostValidator';

interface CreateBody {
  title: string;
  sections: PostSection[];
  tags?: string[];
}

type CreateResponse = ReturnType<Post['toResponse']>;

export async function create(
  req: Request<unknown, unknown, CreateBody>,
  res: Response<CreateResponse>,
) {
  // TODO: frontend sends hash should think about avoiding that anyhow

  const { userId } = req.session;

  const { title, sections, tags } = PostValidator.validateAndPrepare({
    title: req.body.title,
    sections: req.body.sections,
    tags: req.body.tags || [],
  });

  const [post] = await Promise.all([
    PostModel.create({
      title,
      sections,
      tags,
      slug: `${slugLib(title)}-${crypto.randomUUID()}`,
      author: userId,
    }),
    // Clear user template
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

  sendSuccess(res, populatedPost.toResponse());
}
