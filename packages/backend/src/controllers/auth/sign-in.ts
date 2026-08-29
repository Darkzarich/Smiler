import type { Request, Response } from 'express';
import type { Types } from 'mongoose';
import { UserModel, normalizeEmail } from '@models/User';
import { ValidationError, UnauthorizedError, ERRORS } from '@errors';
import { logger } from '@libs/logger';
import { hashPassword, needsRehash, verifyPassword } from '@utils/password';
import { sendSuccess } from '@utils/response-utils';
import { CurrentUserResponse } from './current';
import { authenticateSession } from './session';

interface SignInBody {
  email?: string;
  password?: string;
}

const validate = (fields: SignInBody) => {
  if (!fields.email || !fields.password) {
    return ERRORS.AUTH_FIELDS_REQUIRED;
  }

  if (fields.password.length < 6) {
    return ERRORS.AUTH_PASSWORD_TOO_SHORT;
  }

  if (!/^[^@]+@[^@]+\.[^@]+$/gm.test(fields.email)) {
    return ERRORS.AUTH_INVALID_EMAIL;
  }
};

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
    logger.error('Could not re-hash the password of a signing in user', {
      error,
    });
  }
}

export async function signIn(
  req: Request<unknown, unknown, SignInBody>,
  res: Response<CurrentUserResponse>,
) {
  const fields = {
    email: req.body.email ? normalizeEmail(req.body.email) : undefined,
    password: req.body.password,
  };

  const errorMessage = validate(fields);

  if (errorMessage) {
    throw new ValidationError(errorMessage);
  }

  const foundUser = await UserModel.findOne({
    email: fields.email!,
  }).lean();

  if (!foundUser) {
    throw new UnauthorizedError(ERRORS.AUTH_INVALID_CREDENTIALS);
  }

  const isEqual = await verifyPassword(fields.password!, foundUser);

  if (!isEqual) {
    throw new UnauthorizedError(ERRORS.AUTH_INVALID_CREDENTIALS);
  }

  if (needsRehash(foundUser.hashParams)) {
    await upgradeStoredPassword(foundUser._id, fields.password!);
  }

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
