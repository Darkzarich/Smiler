import type { Request, Response } from 'express';
import { omit } from 'lodash';
import { UserModel, User } from '@models/User';
import { NotFoundError, ERRORS } from '@errors';
import { sendSuccess } from '@utils/response-utils';

interface GetByLoginParams {
  login: string;
}

interface GetByLoginResponse extends Omit<User, 'isFollowed' | '_id'> {
  isFollowed?: boolean;
}

export async function getByLogin(
  req: Request<GetByLoginParams>,
  res: Response<GetByLoginResponse>,
) {
  const { login } = req.params;
  const { userId: currentUserId } = req.session;

  const requestedUser = await UserModel.findOne({
    login,
  }).select({
    login: 1,
    rating: 1,
    bio: 1,
    avatar: 1,
    createdAt: 1,
    followersAmount: 1,
  });

  if (!requestedUser) {
    throw new NotFoundError(ERRORS.USER_NOT_FOUND);
  }

  if (currentUserId === requestedUser._id.toString()) {
    sendSuccess(res, omit(requestedUser.toJSON(), ['_id', 'isFollowed']));

    return;
  }

  const currentUser = await UserModel.findById(currentUserId).select({
    usersFollowed: 1,
  });

  const response = {
    ...omit(requestedUser.toJSON(), '_id'),
    isFollowed: currentUser
      ? currentUser.isFollowed(requestedUser._id.toString())
      : false,
  };

  sendSuccess(res, response);
}
