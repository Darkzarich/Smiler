import type { Request, Response } from 'express';
import { differenceInMilliseconds } from 'date-fns';
import {
  PostModel,
  POST_SECTION_TYPES,
  Post,
  postToResponse,
  PostResponse,
} from '@models/Post';
import { POST_TIME_TO_UPDATE } from '@constants/index';
import { NotFoundError, ForbiddenError, ERRORS } from '@errors';
import { removeFileByPath } from '@utils/remove-file-by-path';
import { sendSuccess } from '@utils/response-utils';
import { PostValidator } from '@validators/PostValidator';

interface UpdateByIdParams {
  id: string;
}

type UpdateByIdBody = Partial<Pick<Post, 'title' | 'sections' | 'tags'>>;

type UpdateByIdResponse = PostResponse;

export async function updateById(
  req: Request<UpdateByIdParams, unknown, UpdateByIdBody>,
  res: Response<UpdateByIdResponse>,
) {
  const { userId } = req.session;
  const { id: postId } = req.params;

  const targetPost = await PostModel.findById(postId, null, {
    populate: { path: 'author', select: { login: 1, avatar: 1 } },
  }).lean();

  if (!targetPost) {
    throw new NotFoundError(ERRORS.POST_NOT_FOUND);
  }

  if (targetPost?.author?._id?.toString() !== userId) {
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
    tags: req.body.tags ?? targetPost.tags,
  });

  const filePathsToDelete: string[] = [];

  targetPost.sections.forEach((section) => {
    if (section.type !== POST_SECTION_TYPES.PICTURE || !section.isFile) {
      return;
    }

    const isPictureSectionGone = !newSections.some(
      (newSection) =>
        newSection.type === POST_SECTION_TYPES.PICTURE &&
        newSection.hash === section.hash,
    );

    if (isPictureSectionGone && section.url.startsWith(`/uploads/${userId}/`)) {
      filePathsToDelete.push(section.url);
    }
  });

  const updatedPost = await PostModel.findByIdAndUpdate(
    postId,
    { $set: { title, tags: tags || [], sections: newSections } },
    {
      new: true,
      lean: true,
      populate: { path: 'author', select: { login: 1, avatar: 1 } },
    },
  );

  sendSuccess(res, postToResponse(updatedPost!));

  await Promise.all(
    filePathsToDelete.map((filePath) => removeFileByPath(filePath)),
  );
}
