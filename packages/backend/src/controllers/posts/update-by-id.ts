import type { Request, Response } from 'express';
import { differenceInMilliseconds } from 'date-fns';
import { PostModel, POST_SECTION_TYPES, Post } from '@models/Post';
import { POST_TIME_TO_UPDATE } from '@constants/index';
import { NotFoundError, ForbiddenError, ERRORS } from '@errors';
import { removeFileByPath } from '@utils/remove-file-by-path';
import { sendSuccess } from '@utils/response-utils';
import { PostValidator } from '@validators/PostValidator';

interface UpdateByIdParams {
  id: string;
}

type UpdateByIdBody = Partial<Pick<Post, 'title' | 'sections' | 'tags'>>;

// TODO: think of something better
type UpdateByIdResponse = ReturnType<Post['toResponse']>;

export async function updateById(
  req: Request<UpdateByIdParams, unknown, UpdateByIdBody>,
  res: Response<UpdateByIdResponse>,
) {
  // TODO: validate sections on update by type and other stuff the same as when creating post
  // TODO: move all Post validation in one place

  const { userId } = req.session;
  const { id: postId } = req.params;

  const targetPost = await PostModel.findById(postId, null, {
    populate: { path: 'author', select: { login: 1, avatar: 1 } },
  });

  if (!targetPost) {
    throw new NotFoundError(ERRORS.POST_NOT_FOUND);
  }

  if (targetPost.author._id.toString() !== userId) {
    throw new ForbiddenError(ERRORS.POST_CANT_EDIT_NOT_OWN);
  }

  if (
    differenceInMilliseconds(Date.now(), targetPost.createdAt) >
    POST_TIME_TO_UPDATE
  ) {
    throw new ForbiddenError(ERRORS.POST_CAN_EDIT_WITHIN_TIME);
  }

  const {
    title,
    sections: newSections,
    tags,
  } = PostValidator.validateAndPrepare({
    title: req.body.title || targetPost.title,
    sections: req.body.sections || targetPost.sections,
    tags: req.body.tags || targetPost.tags,
  });

  const filePathsToDelete: string[] = [];

  if (newSections) {
    // Looking for sections with "picture" type that were uploaded as a file
    // and that got removed from the post in the update
    targetPost.sections.forEach((section) => {
      if (section.type !== POST_SECTION_TYPES.PICTURE || !section.isFile) {
        return;
      }

      const isSectionGone = !newSections.some(
        (newSection) =>
          newSection.type === POST_SECTION_TYPES.PICTURE &&
          newSection.url === section.url,
      );

      if (isSectionGone) {
        filePathsToDelete.push(section.url);
      }
    });
  }

  targetPost.title = title;
  targetPost.tags = tags || [];
  targetPost.sections = newSections;

  await targetPost.save();

  sendSuccess(res, targetPost.toResponse());

  // Remove all deleted files

  // eslint-disable-next-line no-restricted-syntax
  for (const filePath of filePathsToDelete) {
    removeFileByPath(filePath);
  }
}
