import type { Request, Response } from 'express';
import type { Types } from 'mongoose';
import { UserModel } from '@models/User';
import { UnauthorizedError, ERRORS } from '@errors';
import { logger } from '@libs/logger';
import { hashPassword, needsRehash, verifyPassword } from '@utils/password';
import { sendSuccess } from '@utils/response-utils';
import type { SignInBody } from '@validators/auth';
import { CurrentUserResponse } from './current';
import { authenticateSession } from './session';

/**
 * Move a password hashed with outdated parameters onto the current ones. Runs
 * only right after the password was verified, since that's the only moment it
 * is known. Never fails the sign in: the old hash stays valid either way.
 */
async function upgradeStoredPassword(userId: Types.ObjectId, password: string) {
  try {
    const { hash, salt, hashParams } = await hashPassword(password);

    await UserModel.updateOne(
      { _id: userId },
      { $set: { hash, salt, hashParams } },
    );
  } catch (error) {
    logger.error('password_rehash_failed', {
      userId: userId.toString(),
      error,
    });
  }
}

/**
 * Record when the user signed in. Never fails the sign in: the timestamp is
 * bookkeeping, losing it is not a reason to deny an authenticated user.
 */
async function recordLogin(userId: Types.ObjectId) {
  try {
    await UserModel.updateOne(
      { _id: userId },
      { $set: { lastLoginAt: new Date() } },
    );
  } catch (error) {
    logger.error('last_login_record_failed', {
      userId: userId.toString(),
      error,
    });
  }
}

export async function signIn(
  req: Request<unknown, unknown, SignInBody>,
  res: Response<CurrentUserResponse>,
) {
  const { email, password } = req.body;

  const foundUser = await UserModel.findOne({ email }).lean();

  if (!foundUser) {
    throw new UnauthorizedError(ERRORS.AUTH_INVALID_CREDENTIALS);
  }

  const isEqual = await verifyPassword(password, foundUser);

  if (!isEqual) {
    throw new UnauthorizedError(ERRORS.AUTH_INVALID_CREDENTIALS);
  }

  if (needsRehash(foundUser.hashParams)) {
    await upgradeStoredPassword(foundUser._id, password);
  }

  await recordLogin(foundUser._id);

  await authenticateSession(req, foundUser._id.toString());

  // TODO: Maybe move to getters of the model
  const userAuth = {
    _id: foundUser._id.toString(),
    login: foundUser.login,
    isAuth: true,
    rating: foundUser.rating || 0,
    avatar: foundUser.avatar || '',
    email: foundUser.email || '',
    tagsFollowed: foundUser.tagsFollowed || [],
    followersAmount: foundUser.followersAmount,
  };

  sendSuccess(res, userAuth);
}
