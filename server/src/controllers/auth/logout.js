import { sendSuccess } from '../../utils/responseUtils.js';

export async function logout(req, res) {
  req.session.destroy();

  sendSuccess(res);
}
