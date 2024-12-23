import User from '../../models/User.js';
import { ForbiddenError, ERRORS } from '../../errors/index.js';
import { sendSuccess } from '../../utils/responseUtils.js';

export async function getPostTemplate(req, res) {
  if (req.session.userId !== req.params.id) {
    throw new ForbiddenError(ERRORS.TEMPLATE_CANT_SEE_NOT_OWN);
  }

  const template = await User.findById(req.session.userId)
    .select('template')
    .lean();

  sendSuccess(res, template.template);
}
