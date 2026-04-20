import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { UserModel, User, isUserFollowed } from '@models/User';
import { NotFoundError, ERRORS } from '@errors';
import { sendSuccess } from '@utils/response-utils';

interface GetByLoginParams {
  login: string;
}

type GetByLoginResponse = Pick<
  User,
  'login' | 'rating' | 'bio' | 'avatar' | 'createdAt' | 'followersAmount'
> & { _id: Types.ObjectId; isFollowed?: boolean };

export async function getByLogin(
  req: Request<GetByLoginParams>,
  res: Response<GetByLoginResponse>,
) {
  const { login } = req.params;
  const { userId: currentUserId } = req.session;

  const requestedUser = await UserModel.findOne({
    login: login.trim(),
  })
    .select({
      login: 1,
      rating: 1,
      bio: 1,
      avatar: 1,
      createdAt: 1,
      followersAmount: 1,
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
    isFollowed: isUserFollowed(
      (currentUser?.usersFollowed as Types.ObjectId[]) ?? undefined,
      userId.toString(),
    ),
  });
}
