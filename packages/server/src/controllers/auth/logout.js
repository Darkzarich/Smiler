import { sendSuccess } from '../../utils/response-utils.js';

export async function logout(req, res) {
  req.session.destroy();

  sendSuccess(res);
}
