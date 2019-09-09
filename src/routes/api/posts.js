const router = require('express').Router();
const postsController = require('../../controllers/posts');
const auth = require('../auth');

/**
 * @swagger
 *  tags:
 *    - name: Posts
 *      description: Actions with posts
 * definitions:
 *   Post:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *        commentCount:
 *          description: number of comments in a post
 *          type: number
 *        title:
 *          type: string
 *        body:
 *          type: string
 *        author:
 *          $ref: '#/definitions/Author'
 *        slug:
 *          type: string
 *          example: My-post-title-d2k5g8
 *        uploads:
 *          type: array
 *          description: array paths of attachments
 *          items:
 *            type: string
 *        createdAt:
 *          type: string
 *          example: 2019-08-21T22:05:44.788Z
 *        updatedAt:
 *          type: string
 *          example: 2019-09-22T14:02:14.532Z
 */


/**
 * @swagger
 *  /posts:
 *    get:
 *      tags: [Posts]
 *      description: Get all posts
 *      summary: Get all posts
 *      parameters:
 *        - in: query
 *          name: limit
 *          type: string
 *          description: posts per page
 *        - in: query
 *          name: offset
 *          type: string
 *          description: offset from element
 *        - in: query
 *          name: author
 *          type: string
 *          description: By author
 *      responses:
 *        200:
 *          schema:
 *            type: object
 *            properties:
 *              posts:
 *                type: array
 *                items:
 *                  $ref: '#/definitions/Post'
 *              pages:
 *                type: number
 *    post:
 *      tags: [Posts]
 *      description:
 *      summary:
 *      parameters:
 *      responses:
 *    put:
 *      tags: [Posts]
 *      description:
 *      summary:
 *      parameters:
 *      responses:
 */
router.get('/', postsController.getAll);
router.post('/', auth.required, postsController.create);
router.put('/', auth.required, postsController.update);

router.get('/:slug', postsController.getBySlug);

router.post('/upload', auth.required, postsController.upload);

module.exports = router;
