import type { Request } from 'express';
import { RateModel, RateTargetModel, toVotes } from '@models/Rate';
import { sendSuccess } from '@utils/response-utils';
import type { ApiResponse } from '@libs/api-router';
import type { votesSchema, VoteLookupQuery } from '@validators/common';

export async function getMyVotes(
  req: Request<unknown, unknown, unknown, VoteLookupQuery>,
  res: ApiResponse<typeof votesSchema>,
) {
  const { ids } = req.query;

  const ratedTargets = await RateModel.findRatedTargets({
    userId: req.session.userId,
    targetIds: ids,
    targetModel: RateTargetModel.POST,
  });

  sendSuccess(res, toVotes(ids, ratedTargets));
}
