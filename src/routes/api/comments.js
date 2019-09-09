const router = require('express').Router();
const commentsController = require('../../controllers/comments');
const auth = require('../auth');

/**
 * @swagger
 * tags:
 *    - name: Comments
 *      description: Actions with comments
 *
 * definitions:
 *    Comment:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *        post:
 *          type: string
 *        body:
 *          type: string
 *        parent:
 *          type: string
 *        author:
 *          type: object
 *          properties:
 *            id:
 *              type: string
 *            login:
 *              type: string
 *        createdAt:
 *          type: string
 *          example: 2019-08-16T01:04:02.504Z
 *        children:
 *          type: array
 *          items:
 *            $ref: '#/definitions/Comment'
 *
 */

/**
 * @swagger
 * /comments:
 *  get:
 *    summary: Get user's comments or comments in a post
 *    tags: [Comments]
 *    parameters:
 *      - in: query
 *        name: offset
 *        type: integer
 *        description: The number of items to skip before starting to collect the result set.
 *      - in: query
 *        name: limit
 *        type: integer
 *        description: The numbers of items to return.
 *      - in: query
 *        name: login
 *        type: string
 *        description: user which comments you want to see
 *        example: user123
 *      - in: query
 *        name: post
 *        required: true
 *        type: string
 *        description: post id
 *        example: 5d546c95c0f3a272b2062205
 *    responses:
 *      200:
 *        schema:
 *          $ref: '#/definitions/Comment'
 *      404:
 *        $ref: '#/responses/NotFound'
 *      422:
 *        $ref: '#/responses/UnprocessableEntity'
 *  post:
 *    summary: Create a comment
 *    tags: [Comments]
 *    description: Create a comment to a post
 *    security:
 *      - myCookie: []
 *    parameters:
 *      - in: body
 *        schema:
 *          type: object
 *          required:
 *            - post
 *          properties:
 *            body:
 *              type: string
 *              example: My body is dry
 *            post:
 *              type: string
 *              example: 5d546c95c0f3a272b2062205
 *            parent:
 *              type: string
 *              example: 5d55daa034c1991762147c2b
 *    responses:
 *      404:
 *        $ref: '#/responses/NotFound'
 *      422:
 *        $ref: '#/responses/UnprocessableEntity'
 *
 */
router.get('/', commentsController.getComment);

router.post('/', auth.required, commentsController.createComment);

router.put('/:id', auth.required, commentsController.editComment);

router.delete('/:id', auth.required, commentsController.deleteComment);

module.exports = router;
