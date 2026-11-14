import type { Request } from 'express';
import { Types } from 'mongoose';
import { UserModel, isUserFollowed } from '@models/User';
import { NotFoundError, ERRORS } from '@errors';
import { sendSuccess } from '@utils/response-utils';
import type { ApiResponse } from '@libs/api-router';
import type { userProfileSchema, UserLoginParams } from '@validators/users';

export async function getByLogin(
  req: Request<UserLoginParams>,
  res: ApiResponse<typeof userProfileSchema>,
) {
  const { login } = req.params;
  const { userId: currentUserId } = req.session;

  const requestedUser = await UserModel.findOne({ login })
    .select({
      login: 1,
      rating: 1,
      bio: 1,
      avatar: 1,
      createdAt: 1,
      followersAmount: 1,
      lastLoginAt: 1,
    })
    .lean();

  if (!requestedUser) {
    throw new NotFoundError(ERRORS.USER_NOT_FOUND);
  }

  const {
    login: userLogin,
    rating,
    bio,
    avatar,
    createdAt,
    followersAmount,
    lastLoginAt,
  } = requestedUser;
  const userId = requestedUser._id;

  if (currentUserId === userId.toString()) {
    sendSuccess(res, {
      _id: userId,
      login: userLogin,
      rating,
      bio,
      avatar,
      createdAt,
      followersAmount,
      lastLoginAt,
    });

    return;
  }

  const currentUser = await UserModel.findById(currentUserId)
    .select({
      usersFollowed: 1,
    })
    .lean();

  sendSuccess(res, {
    _id: userId,
    login: userLogin,
    rating,
    bio,
    avatar,
    createdAt,
    followersAmount,
    lastLoginAt,
    isFollowed: isUserFollowed(
      (currentUser?.usersFollowed as Types.ObjectId[]) ?? undefined,
      userId.toString(),
    ),
  });
}
