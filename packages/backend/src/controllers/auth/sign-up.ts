import type { Request, Response } from 'express';
import { UserModel, normalizeEmail, normalizeLogin } from '@models/User';
import { ValidationError, ConflictError, ERRORS } from '@errors';
import {
  isDuplicateKeyError,
  getDuplicateKeyField,
} from '@utils/check-mongo-db-error';
import { hashPassword } from '@utils/password';
import { sendSuccess } from '@utils/response-utils';
import { CurrentUserResponse } from './current';
import { authenticateSession } from './session';

interface SignUpBody {
  email?: string;
  login?: string;
  password?: string;
  confirm?: string;
}

/** Validate user sign up, return error message or nothing */
const validate = (fields: SignUpBody) => {
  if (!fields.login || !fields.password || !fields.confirm || !fields.email) {
    return ERRORS.AUTH_FIELDS_REQUIRED;
  }

  if (fields.login.length < 3 || fields.login.length > 15) {
    return ERRORS.AUTH_LOGIN_WRONG_LENGTH;
  }

  if (fields.password.length < 6) {
    return ERRORS.AUTH_PASSWORD_TOO_SHORT;
  }

  if (fields.password !== fields.confirm) {
    return ERRORS.AUTH_PASSWORDS_NOT_EQUAL;
  }

  if (!/^[^@]+@[^@]+\.[^@]+$/gm.test(fields.email)) {
    return ERRORS.AUTH_INVALID_EMAIL;
  }
};

export async function signUp(
  req: Request<unknown, unknown, SignUpBody>,
  res: Response<CurrentUserResponse>,
) {
  const user = {
    email: req.body.email ? normalizeEmail(req.body.email) : undefined,
    login: req.body.login ? normalizeLogin(req.body.login) : undefined,
    password: req.body.password,
    confirm: req.body.confirm,
  };

  const errorMessage = validate(user);

  if (errorMessage) {
    throw new ValidationError(errorMessage);
  }

  const { hash, salt, hashParams } = await hashPassword(user.password!);

  try {
    const newUser = await UserModel.create({
      login: user.login,
      email: user.email,
      hash,
      salt,
      hashParams,
      lastLoginAt: new Date(),
    });

    await authenticateSession(req, newUser._id.toString());

    const userAuth = {
      _id: newUser._id.toString(),
      login: newUser.login,
      isAuth: true,
      rating: newUser.rating,
      avatar: newUser.avatar,
      email: newUser.email,
      tagsFollowed: newUser.tagsFollowed,
      followersAmount: newUser.followersAmount,
    };

    sendSuccess(res, userAuth);
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
