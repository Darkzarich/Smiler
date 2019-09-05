const router = require('express').Router();
const commentsController = require('../../controllers/comments');
const auth = require('../auth');

/**
 * @swagger
 *  tags:
 *    - Comments
 *    - description: actions with comments
 */

/**
 * @swagger
 * /comments:
 *  get:
 *    summary: Get user's comments or comments in a post
 *    tags: [Comments]
 *    parameters:
 *      - in: query
 *        name: login
 *        type: string
 *        description: user which comments you want to see
 *        example: user123
 *      - in: query
 *        name: post
 *        type: string
 *        description: post id
 *        example: 5d546c95c0f3a272b2062205
 *      - in: query
 *        name: offset
 *        type: integer
 *        description: The number of items to skip before starting to collect the result set.
 *      - in: query
 *        name: limit
 *        type: integer
 *        description: The numbers of items to return.
 */
router.get('/', commentsController.getComment);

router.post('/', auth.required, commentsController.createComment);

router.put('/:id', auth.required, commentsController.editComment);

router.delete('/:id', auth.required, commentsController.deleteComment);

module.exports = router;
