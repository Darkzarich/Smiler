import {
  prop,
  getModelForClass,
  type Ref,
  index,
  modelOptions,
  type ReturnModelType,
  type DocumentType,
} from '@typegoose/typegoose';
import type { Comment } from '@models/Comment';
import type { Post } from '@models/Post';
import type { User } from '@models/User';
import { isDuplicateKeyError } from '@utils/check-mongo-db-error';

export enum RateTargetModel {
  POST = 'Post',
  COMMENT = 'Comment',
}

interface ApplyChangeParams {
  userId: string;
  targetId: string;
  targetModel: RateTargetModel;
  negative: boolean;
  rateValue: number;
}

interface RemoveForUserParams {
  userId: string;
  targetId: string;
  targetModel: RateTargetModel;
}

type ApplyChangeResult =
  | {
      alreadyRated: true;
    }
  | {
      alreadyRated: false;
      rate: DocumentType<Rate>;
      ratingDelta: number;
    };

@index({ target: 1 })
@index(
  { user: 1, target: 1, targetModel: 1 },
  {
    unique: true,
    partialFilterExpression: { user: { $exists: true } },
  },
)
@modelOptions({
  schemaOptions: {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
    },
  },
})
export class Rate {
  @prop({ required: true, ref: 'User' })
  public user!: Ref<User>;

  @prop({ default: false, type: Boolean })
  public negative!: boolean;

  @prop({ required: true, refPath: 'targetModel' })
  public target!: Ref<Post | Comment>;

  @prop({ required: true, enum: RateTargetModel })
  public targetModel!: RateTargetModel;

  public static async applyChange(
    this: ReturnModelType<typeof Rate>,
    { userId, targetId, targetModel, negative, rateValue }: ApplyChangeParams,
  ): Promise<ApplyChangeResult> {
    const oppositeRate = await this.findOneAndUpdate(
      {
        user: userId,
        target: targetId,
        targetModel,
        negative: !negative,
      },
      {
        $set: { negative },
      },
      { new: false },
    );

    if (oppositeRate) {
      return {
        alreadyRated: false,
        rate: oppositeRate,
        ratingDelta: rateValue * 2,
      };
    }

    const sameRate = await this.findOne({
      user: userId,
      target: targetId,
      targetModel,
      negative,
    });

    if (sameRate) {
      return {
        alreadyRated: true,
      };
    }

    try {
      const newRate = await this.create({
        user: userId,
        target: targetId,
        targetModel,
        negative,
      });

      return {
        alreadyRated: false,
        rate: newRate,
        ratingDelta: rateValue,
      };
    } catch (error) {
      if (!isDuplicateKeyError(error)) {
        throw error;
      }

      const currentRate = await this.findOne({
        user: userId,
        target: targetId,
        targetModel,
      });

      if (currentRate?.negative === negative) {
        return {
          alreadyRated: true,
        };
      }

      const concurrentlyChangedRate = await this.findOneAndUpdate(
        {
          user: userId,
          target: targetId,
          targetModel,
          negative: !negative,
        },
        {
          $set: { negative },
        },
        { new: false },
      );

      if (concurrentlyChangedRate) {
        return {
          alreadyRated: false,
          rate: concurrentlyChangedRate,
          ratingDelta: rateValue * 2,
        };
      }

      return {
        alreadyRated: true,
      };
    }
  }

  public static removeForUser(
    this: ReturnModelType<typeof Rate>,
    { userId, targetId, targetModel }: RemoveForUserParams,
  ) {
    return this.findOneAndDelete({
      user: userId,
      target: targetId,
      targetModel,
    });
  }
}

export const RateModel = getModelForClass(Rate);
