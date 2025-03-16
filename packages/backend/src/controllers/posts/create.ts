import slugLib from 'slug';
import crypto from 'crypto';
import User from '../../models/User';
import Post from '../../models/Post';
import { sendSuccess } from '../../utils/response-utils';
import { PostValidator } from '../../validators/PostValidator';

export async function create(req, res) {
  // TODO: frontend sends hash should think about avoiding that anyhow

  const { userId } = req.session;

  const { title, sections, tags } = PostValidator.validateAndPrepare({
    title: req.body.title,
    sections: req.body.sections,
    tags: req.body.tags,
  });

  const [post] = await Promise.all([
    Post.create({
      title,
      sections,
      tags,
      slug: `${slugLib(title)}-${crypto.randomUUID()}`,
      author: userId,
    }),
    // Clear user template
    User.updateOne(
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

  const populatedPost = await post
    .populate('author', 'login avatar')
    .execPopulate();

  sendSuccess(res, populatedPost.toResponse());
}
