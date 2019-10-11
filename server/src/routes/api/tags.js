const router = require('express').Router();
const tagsController = require('../../controllers/tags');
const auth = require('../auth');

/**
 * @swagger
 * /tags/{tag}/follow:
 *  put:
 *    tags: [Tags]
 *    summary: Follow the tag
 *    security:
 *      - cookieAuth: []
 *    parameters:
 *      - in: path
 *        name: tag
 *        required: true
 *        schema:
 *          type: string
 *    responses:
 *      200:
 *        $ref: '#/components/responses/OK'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      422:
 *        $ref: '#/components/responses/UnprocessableEntity'
 *  delete:
 *    tags: [Tags]
 *    summary: Unfollow the tag
 *    security:
 *      - cookieAuth: []
 *    parameters:
 *      - in: path
 *        name: tag
 *        required: true
 *        schema:
 *          type: string
 *    responses:
 *      200:
 *        $ref: '#/components/responses/OK'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      422:
 *        $ref: '#/components/responses/UnprocessableEntity'
 */

router.put('/:tag/follow', auth.required, tagsController.follow);
router.delete('/:tag/follow', auth.required, tagsController.unfollow);

module.exports = router;
