import type { Request, Response } from 'express';
import { User, UserModel } from '@models/User';
import { NotFoundError, ValidationError, ERRORS } from '@errors';
import { sendSuccess } from '@utils/response-utils';

type UpdateMeBody = Partial<Pick<User, 'bio'>>;

interface UpdateMeResponse
  extends Pick<
    User,
    'login' | 'rating' | 'bio' | 'avatar' | 'createdAt' | 'followersAmount'
  > {
  _id: string;
}

function validateAndPickUpdateMeBody(
  body: Record<string, unknown>,
): UpdateMeBody {
  const update: UpdateMeBody = {};

  if (body.bio !== undefined) {
    if (typeof body.bio !== 'string') {
      throw new ValidationError(ERRORS.USER_UPDATE_FIELD_INVALID);
    }

    update.bio = body.bio;
  }

  // The avatar is not a plain field any more: it names a file this server
  // downloaded and stored, so it is set through `PUT /users/me/avatar`.

  return update;
}

export async function updateMe(
  req: Request<unknown, unknown, UpdateMeBody>,
  res: Response<UpdateMeResponse>,
) {
  const { userId } = req.session!;
  const update = validateAndPickUpdateMeBody(req.body);

  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    { $set: update },
    {
      runValidators: true,
      new: true,
      lean: true,
    },
  ).select({
    login: 1,
    rating: 1,
    bio: 1,
    avatar: 1,
    createdAt: 1,
    followersAmount: 1,
  });

  if (!updatedUser) {
    throw new NotFoundError(ERRORS.USER_NOT_FOUND);
  }

  sendSuccess(res, {
    _id: updatedUser._id.toString(),
    login: updatedUser.login,
    rating: updatedUser.rating,
    bio: updatedUser.bio,
    avatar: updatedUser.avatar,
    createdAt: updatedUser.createdAt,
    followersAmount: updatedUser.followersAmount,
  });
}
