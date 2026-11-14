import type { Request } from 'express';
import { UserModel } from '@models/User';
import { ConflictError, ERRORS } from '@errors';
import {
  isDuplicateKeyError,
  getDuplicateKeyField,
} from '@utils/check-mongo-db-error';
import { hashPassword } from '@utils/password';
import { sendSuccess } from '@utils/response-utils';
import { authenticateSession } from './session';
import type { ApiResponse } from '@libs/api-router';
import type { authStateSchema, SignUpBody } from '@validators/auth';

export async function signUp(
  req: Request<unknown, unknown, SignUpBody>,
  res: ApiResponse<typeof authStateSchema>,
) {
  const { login, email, password } = req.body;

  const { hash, salt, hashParams } = await hashPassword(password);

  try {
    const newUser = await UserModel.create({
      login,
      email,
      hash,
      salt,
      hashParams,
      lastLoginAt: new Date(),
    });

    await authenticateSession(req, newUser._id.toString());

    sendSuccess(res, {
      _id: newUser._id.toString(),
      login: newUser.login,
      isAuth: true,
      rating: newUser.rating,
      avatar: newUser.avatar,
      email: newUser.email,
      tagsFollowed: newUser.tagsFollowed,
      followersAmount: newUser.followersAmount,
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      const duplicateField = getDuplicateKeyField(error);

      if (duplicateField === 'email') {
        throw new ConflictError(ERRORS.AUTH_EMAIL_ALREADY_EXISTS);
      }

      if (duplicateField === 'login') {
        throw new ConflictError(ERRORS.AUTH_LOGIN_ALREADY_EXISTS);
      }

      throw new ConflictError(ERRORS.AUTH_CONFLICT);
    }

    throw error;
  }
}
