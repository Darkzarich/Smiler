// @ts-check
import cloneDeep from 'lodash/cloneDeep';

const auth = {
  isAuth: false,
};

/**
 * Generates an authentication fixture with the specified authentication status.
 *
 * @param {boolean} isAuth - The authentication status to assign to the generated fixture.
 * Defaults to `false`.
 * @returns {object} The generated authentication fixture.
 */
export default function generateAuth(isAuth = false) {
  const newAuth = cloneDeep(auth);

  auth.isAuth = isAuth;

  return newAuth;
}
