import User from '../../models/User.js';
import { ForbiddenError } from '../../errors/index.js';
import { sendSuccess } from '../../utils/responseUtils.js';

export async function getPostTemplate(req, res) {
  if (req.session.userId !== req.params.id) {
    throw new ForbiddenError('Can see only your own template');
  }

  const template = await User.findById(req.session.userId)
    .select('template')
    .lean();

  sendSuccess(res, template.template);
}
