import request from 'supertest';
import { POST_MAX_TAG_LEN } from '../../../src/constants';
import { UserModel } from '../../../src/models/User';

import { signUpRequest } from '../../utils/request-auth';
import { ERRORS } from '../../../src/errors';

describe('PUT /tags/:tag/follow', () => {
  const tag = 'test-tag';

  it('Should return status 401 and an expected message if user is not signed in', async () => {
    const response = await request(global.app).put(`/api/tags/${tag}/follow`);

    expect(response.body.error.message).toBe(ERRORS.UNAUTHORIZED);
    expect(response.status).toBe(401);
  });

  it('Should return status 422 and an expected message for a too long tag', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .put(`/api/tags/${'a'.repeat(POST_MAX_TAG_LEN + 1)}/follow`)
      .set('Cookie', sessionCookie);

    expect(response.body.error.message).toBe(ERRORS.POST_TAG_MAX_LEN_EXCEEDED);
    expect(response.status).toBe(422);
  });

  it('Should return status 200 and an expected message for a valid tag', async () => {
    const { sessionCookie } = await signUpRequest(global.app);

    const response = await request(global.app)
      .put(`/api/tags/${tag}/follow`)
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
  });

  it('Should add the tag to the user tags', async () => {
    const { sessionCookie, currentUser } = await signUpRequest(global.app);

    await request(global.app)
      .put(`/api/tags/${tag}/follow`)
      .set('Cookie', sessionCookie);

    const user = await UserModel.findById(currentUser.id);

    expect(user!.tagsFollowed).toContain(tag);
  });
});
