import request from 'supertest';
import { POST_MAX_TAG_LEN } from '@constants/index';
import { UserModel } from '@models/User';

import { signUpRequest } from '@test-utils/request-auth';
import { ERRORS } from '@errors';

describe('DELETE /tags/:tag/follow', () => {
  const tag = 'test-tag';

  it('Should return status 401 and an expected message if user is not signed in', async () => {
    const response = await request(global.app).delete(
      `/api/tags/${tag}/follow`,
    );

    expect(response.body.error.message).toBe(ERRORS.UNAUTHORIZED);
    expect(response.status).toBe(401);
  });

  it('Should return status 422 and an expected message for a too long tag', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .delete(`/api/tags/${'a'.repeat(POST_MAX_TAG_LEN + 1)}/follow`)
      .set('Cookie', sessionCookie);

    expect(response.body.error.message).toBe(ERRORS.POST_TAG_MAX_LEN_EXCEEDED);
    expect(response.status).toBe(422);
  });

  it('Should return status 200 and an expected message for a valid tag', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .delete(`/api/tags/${tag}/follow`)
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
  });

  it('Should add the tag to the user tags', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    // Making sure a tag is added before unfollowing
    await UserModel.findByIdAndUpdate(currentUser.id, {
      $push: { tagsFollowed: tag },
    });

    await request(global.app)
      .delete(`/api/tags/${tag}/follow`)
      .set('Cookie', sessionCookie);

    const user = await UserModel.findById(currentUser.id);

    expect(user!.tagsFollowed).not.toContain(tag);
  });
});
