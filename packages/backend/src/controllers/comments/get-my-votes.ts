import type { Request, Response } from 'express';
import { RateModel, RateTargetModel, toVotes } from '@models/Rate';
import { sendSuccess } from '@utils/response-utils';
import type { VoteLookupQuery, Votes } from '@validators/common';

export async function getMyVotes(
  req: Request<unknown, unknown, unknown, VoteLookupQuery>,
  res: Response<Votes>,
) {
  const { ids } = req.query;

  const ratedTargets = await RateModel.findRatedTargets({
    userId: req.session.userId,
    targetIds: ids,
    targetModel: RateTargetModel.COMMENT,
  });

  sendSuccess(res, toVotes(ids, ratedTargets));
}
