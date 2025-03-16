import { sendSuccess } from '../../utils/response-utils';

export async function logout(req, res) {
  req.session.destroy();

  sendSuccess(res);
}
