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
 *      description: Create a post with title `title` and body `body`. Attachments are taken from the template
 *      summary: create a post
 *      security:
 *        - myCookie[]
 *      parameters:
 *        - in: body
 *          name: post
 *          schema:
 *            type: object
 *            required: [title, body]
 *            properties:
 *              title:
 *                type: string
 *              body:
 *                type: string
 *      responses:
 *        200:
 *          description: OK
 *          schema:
 *            $ref: '#/definitions/Post'
 *        422:
 *          $ref: '#/responses/UnprocessableEntity'
 *        401:
 *          $ref: '#/responses/Unauthorized'
 */
router.get('/', postsController.getAll);
router.post('/', auth.required, postsController.create);


/**
 * @swagger
 * /posts/{slug}:
 *    put:
 *      tags: [Posts]
 *      security:
 *        - myCookie[]
 *      description: Edit a post. You can edit a post only within certain time after it is created
 *      summary: edit a post
 *      parameters:
 *        - in: path
 *          name: slug
 *          required: true
 *          type: string
 *        - in: body
 *          schema:
 *            type: object
 *            name: data
 *            properties:
 *              title:
 *                type: string
 *              body:
 *                type: string
 *              toDelete:
 *                type: array
 *                items:
 *                  description: paths to delete
 *                  type: string
 *      responses:
 *        200:
 *          $ref: '#/responses/OK'
 *        403:
 *          $ref: '#/responses/Forbidden'
 *        401:
 *          $ref: '#/responses/Unauthorized'
 *        404:
 *          $ref: '#/responses/NotFound'
 *    delete:
 *      tags: [Posts]
 *    get:
 *      tags: [Posts]
 */
router.put('/:slug', auth.required, postsController.update);
router.delete('/:slug', auth.required, postsController.delete);
router.get('/:slug', postsController.getBySlug);


router.post('/upload', auth.required, postsController.upload);

module.exports = router;
