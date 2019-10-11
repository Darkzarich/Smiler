const router = require('express').Router();
const postsController = require('../../controllers/posts');
const auth = require('../auth');

/**
 * @swagger
 * tags:
 *    - name: Posts
 *      description: Actions with posts
 * components:
 *  schemas:
 *    Post:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         commentCount:
 *           description: number of comments in a post
 *           type: number
 *         title:
 *           type: string
 *         sections:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PostSection'
 *         author:
 *           $ref: '#/components/schemas/Author'
 *         slug:
 *           type: string
 *           example: My-post-title-d2k5g8
 *         createdAt:
 *           type: string
 *           example: 2019-08-21T22:05:44.788Z
 *         updatedAt:
 *           type: string
 *           example: 2019-09-22T14:02:14.532Z
 *         rating:
 *           type: number
 *         tags:
 *           type: array
 *           items:
 *            type: string
 *         rated:
 *           $ref: '#/components/schemas/UserRate'
 *    UserRate:
 *       type: object
 *       properties:
 *         isRated:
 *           type: boolean
 *         negative:
 *           type: boolean
 *    PostSection:
 *      oneOf:
 *        - $ref: '#/components/schemas/PostSectionText'
 *        - $ref: '#/components/schemas/PostSectionImage'
 *        - $ref: '#/components/schemas/PostSectionVideo'
 *    PostSectionText:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           enum: [text]
 *         content:
 *           type: string
 *           maxLength: 4500
 *         hash:
 *           type: string
 *    PostSectionImage:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           enum: [pic]
 *         url:
 *           type: string
 *         hash:
 *           type: string
 *         isFile:
 *           type: boolean
 *           default: false
 *    PostSectionVideo:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           enum: [vid]
 *         url:
 *           type: string
 *         hash:
 *           type: string
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
 *          required: true
 *          schema:
 *            type: number
 *            default: 100
 *            maximum: 100
 *            minimum: 1
 *          description: posts per page
 *        - in: query
 *          name: sort
 *          schema:
 *            type: string
 *          description: Sorts posts by field `sort`, default descending. `-<sortField>` - ascending sort.
 *          examples:
 *            descending:
 *              summary: Example of descending sort by field `createdAt`
 *              value: -createdAt
 *            ascending:
 *              summary: Example of ascending sort by field `rating`
 *              value: rating
 *        - in: query
 *          name: offset
 *          required: true
 *          schema:
 *            type: number
 *            default: 0
 *          description: offset from element
 *        - in: query
 *          name: tags
 *          schema:
 *            type: array
 *            items:
 *              type: string
 *          explode: form
 *        - in: query
 *          name: author
 *          schema:
 *            type: string
 *          description: By author
 *        - in: query
 *          name: title
 *          description: Seach post by title
 *          schema:
 *            type: string
 *        - in: query
 *          name: dateFrom
 *          description: Show posts posted after `dateFrom`
 *          schema:
 *            type: string
 *          example: 2019-08-21T22:05:44.788Z
 *        - in: query
 *          name: dateTo
 *          description: Show posts posted before `dateTo`
 *          schema:
 *            type: string
 *          example: 2019-09-21T22:05:44.788Z
 *        - in: query
 *          name: ratingFrom
 *          description: Show posts posted with rating above `ratingFrom`
 *          schema:
 *            type: string
 *        - in: query
 *          name: ratingTo
 *          description: Show posts posted with rating below `ratingTo`
 *          schema:
 *            type: string
 *      responses:
 *        200:
 *          description: OK
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  posts:
 *                    type: array
 *                    items:
 *                      $ref: '#/components/schemas/Post'
 *                  pages:
 *                    type: number
 *    post:
 *      tags: [Posts]
 *      description: Create a post with `title` and `sections`. Creating a post clears the template.
 *      summary: create a post
 *      security:
 *        - cookieAuth: []
 *      requestBody:
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required: [title, sections]
 *              properties:
 *                title:
 *                  type: string
 *                sections:
 *                  type: array
 *                  items:
 *                    $ref: '#/components/schemas/PostSection'
 *                tags:
 *                  type: array
 *                  items:
 *                    type: string
 *      responses:
 *        200:
 *          description: OK
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Post'
 *        422:
 *          $ref: '#/components/responses/UnprocessableEntity'
 *        401:
 *          $ref: '#/components/responses/Unauthorized'
 */
router.get('/', postsController.getAll);
router.post('/', auth.required, postsController.create);

/**
 * @swagger
 *  /posts/feed:
 *    get:
 *      tags: [Posts]
 *      description: Get feed
 *      summary: Get feed
 *      parameters:
 *        - in: query
 *          name: limit
 *          required: true
 *          schema:
 *            type: number
 *            default: 20
 *            maximum: 100
 *            minimum: 1
 *          description: posts per page
 *        - in: query
 *          name: offset
 *          required: true
 *          schema:
 *            type: number
 *            default: 0
 *          description: offset from element
 *      responses:
 *        200:
 *          description: OK
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  posts:
 *                    type: array
 *                    items:
 *                      $ref: '#/components/schemas/Post'
 *                  pages:
 *                    type: number
 *        401:
 *          $ref: '#/components/responses/Unauthorized'
 */

router.get('/feed', auth.required, postsController.getFeed);

/**
 * @swagger
 * /posts/{id}:
 *    put:
 *      tags: [Posts]
 *      security:
 *        - cookieAuth: []
 *      description: Edit a post. You can edit a post only within certain time after it is created
 *      summary: edit a post
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *      requestBody:
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                title:
 *                  type: string
 *                tags:
 *                  type: array
 *                  items:
 *                    type: string
 *                sections:
 *                  type: array
 *                  items:
 *                    $ref: '#/components/schemas/PostSection'
 *      responses:
 *        200:
 *          $ref: '#/components/responses/OK'
 *        403:
 *          $ref: '#/components/responses/Forbidden'
 *        401:
 *          $ref: '#/components/responses/Unauthorized'
 *        404:
 *          $ref: '#/components/responses/NotFound'
 *        405:
 *          $ref: '#/components/responses/MethodNotAllowed'
 *    delete:
 *      tags: [Posts]
 *      summary: delete a post by its Id
 *      description: delete a post by its `Id`
 *      security:
 *        - cookieAuth: []
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *      responses:
 *        200:
 *          $ref: '#/components/responses/OK'
 *        403:
 *          $ref: '#/components/responses/Forbidden'
 *        404:
 *          $ref: '#/components/responses/NotFound'
 *        401:
 *          $ref: '#/components/responses/Unauthorized'
 *        405:
 *          $ref: '#/components/responses/MethodNotAllowed'
 *    get:
 *      tags: [Posts]
 *      summary: get a post by its slug
 *      description: Get a post by its `slug`
 *      parameters:
 *        - in: path
 *          name: slug
 *          schema:
 *            type: string
 *          required: true
 *      responses:
 *        200:
 *          description: OK
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Post'
 *        404:
 *          $ref: '#/components/responses/NotFound'
 */
router.put('/:id', auth.required, postsController.update);
router.delete('/:id', auth.required, postsController.delete);
router.get('/:slug', postsController.getBySlug);

/**
 * @swagger
 * /posts/upload:
 *  post:
 *    tags: [Posts]
 *    summary: upload picture
 *    description: "Upload the picture to template. Allowed extentions: `jpg|jpeg|png|gif`"
 *    security:
 *      - cookieAuth: []
 *    requestBody:
 *      content:
 *        multipart/form-data:
 *          schema:
 *            type: object
 *            properties:
 *              picture:
 *                type: string
 *                format: binary
 *    responses:
 *      200:
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/PostSectionImage'
 *      422:
 *        $ref: '#/components/responses/UnprocessableEntity'
 *      409:
 *        $ref: '#/components/responses/Conflict'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      413:
 *        $ref: '#/components/responses/RequestEntityTooLarge'
 *      500:
 *        $ref: '#/components/responses/InternalServerError'
 */
router.post('/upload', auth.required, postsController.upload);

/**
 * @swagger
 *  /posts/{id}/rate:
 *    put:
 *      summary: Change rate on post
 *      description: "Changes rate for post. `negative` decides direction.
 * You can't rate post again before deleting previous rate"
 *      tags: [Posts]
 *      security:
 *        - cookieAuth: []
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *      requestBody:
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                negative:
 *                  type: boolean
 *                  default: false
 *      responses:
 *        200:
 *          $ref: '#/components/responses/OK'
 *        405:
 *          $ref: '#/components/responses/MethodNotAllowed'
 *        401:
 *          $ref: '#/components/responses/Unauthorized'
 *        404:
 *          $ref: '#/components/responses/NotFound'
 *    delete:
 *      summary: Unrate post
 *      description: Delete already existing rate for user for post
 *      tags: [Posts]
 *      security:
 *        - cookieAuth: []
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: string
 *      responses:
 *        200:
 *          $ref: '#/components/responses/OK'
 *        405:
 *          $ref: '#/components/responses/MethodNotAllowed'
 *        401:
 *          $ref: '#/components/responses/Unauthorized'
 *        404:
 *          $ref: '#/components/responses/NotFound'
 */
router.delete('/:id/rate', auth.required, postsController.unrate);
router.put('/:id/rate', auth.required, postsController.rate);

module.exports = router;
