import { defaultsDeep } from 'lodash';
import { Rate, RateTargetModel } from '@models/Rate';

export function generateRate(overrides: Partial<Rate> = {}) {
  const rate = {
    negative: false,
    target: '5d5467b4c17806706f3df347',
    targetModel: RateTargetModel.POST,
  };

  return defaultsDeep(overrides, rate);
}
