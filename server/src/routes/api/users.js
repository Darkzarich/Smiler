const router = require('express').Router();
const usersController = require('../../controllers/users');
const auth = require('../auth');

/**
*  @swagger
*  tags:
*   - name: Users
*     description: Actions with Users collection
* definitions:
*  Author:
*   type: object
*   properties:
*     id:
*       type: string
*     login:
*       type: string
*       example: user123
*     avatar:
*       type: string
*  UserProfile:
*   type: object
*   properties:
*     id:
*       type: string
*     login:
*       type: string
*     rating:
*       type: number
*     bio:
*       type: string
*     avatar:
*       type: string
*     createdAt:
*       type: string
*  AuthState:
*   type: object
*   properties:
*     email:
*       type: string
*     login:
*       type: string
*     avatar:
*       type: string
*     isAuth:
*       type: boolean
*     rating:
*       type: number
*/

/**
 * @swagger
 * /users/get-auth:
 *  get:
 *    summary: Check login state
 *    description: Return user auth status
 *    tags: [Users]
 *    responses:
 *      200:
 *        description: OK
 *        schema:
 *          $ref: '#/definitions/AuthState'
 */
router.get('/get-auth', usersController.getAuth);

/**
 * @swagger
 * /users/{login}:
 *  get:
 *    tags: [Users]
 *    summary: Get user profile
 *    description: Get user profile
 *    parameters:
 *      - in: path
 *        name: login
 *        type: string
 *        required: true
 *    responses:
 *      200:
 *        description: OK
 *        schema:
 *          $ref: '#/definitions/UserProfile'
 *      404:
 *        $ref: '#/responses/NotFound'
 *  put:
 *    tags: [Users]
 *    summary: Update user info
 *    description: Update user info with payload
 *    security:
 *      - myCookie: []
 *    parameters:
 *      - in: path
 *        name: login
 *        type: string
 *        required: true
 *      - in: body
 *        name: body
 *        schema:
 *          type: object
 *          properties:
 *            bio:
 *              type: string
 *              maxLength: 300
 *            avatar:
 *              type: string
 *              maxLength: 150
 *              description: URL
 *    responses:
 *      200:
 *        $ref: '#/responses/OK'
 *      404:
 *        $ref: '#/responses/NotFound'
 *      401:
 *        $ref: '#/responses/Unauthorized'
 *      403:
 *        $ref: '#/responses/Forbidden'
 *      422:
 *        $ref: '#/responses/UnprocessableEntity'
 */
router.get('/:login', usersController.getUser);
router.put('/:login', auth.required, usersController.updateUser);

/**
 * @swagger
 * /users/{login}/template:
 *    get:
 *      summary: Get user saved template
 *      tags: [Users]
 *      security:
 *        - myCookie: []
 *      description: Returns user's saved template for post
 *      parameters:
 *        - in: path
 *          name: login
 *          type: string
 *          required: true
 *          description: User name
 *      responses:
 *        200:
 *          description: ok
 *          schema:
 *             type: object
 *             properties:
 *                title:
 *                  type: string
 *                body:
 *                  type: string
 *                attachments:
 *                  description: Array of pic paths
 *                  type: array
 *                  items:
 *                    type: string
 *        403:
 *          $ref: '#/responses/Forbidden'
 *        401:
 *          $ref: '#/responses/Unauthorized'
 *    put:
 *      summary: Update user template
 *      tags: [Users]
 *      description: Update user post template, delete attachments (pics with following paths)
 *      security:
 *        - myCookie: []
 *      parameters:
 *       - in: path
 *         name: login
 *         type: string
 *         required: true
 *         description: User name
 *       - in: body
 *         name: body
 *         schema:
 *           type: object
 *           properties:
 *            title:
 *              type: string
 *            body:
 *              type: string
 *            delete:
 *              type: array
 *              items:
 *                description: path to pic
 *                type: string
 *      responses:
 *        200:
 *          $ref: '#/responses/OK'
 *        403:
 *          $ref: '#/responses/Forbidden'
 *        401:
 *          $ref: '#/responses/Unauthorized'
 *
 */

router.get('/:login/template', auth.required, usersController.getUserPostTemplate);

router.put('/:login/template', auth.required, usersController.updateUserPostTemplate);

/**
 * @swagger
 * /users:
 *    post:
 *      summary: Register a user
 *      tags: [Users]
 *      description: Register a new user and return its cookie token (connect.sid)
 *      parameters:
 *        - in: body
 *          name: body
 *          schema:
 *            type: object
 *            required: [login, password, confirm]
 *            description: user's credential
 *            properties:
 *              login:
 *                type: string
 *                minLength: 3
 *                maxLength: 10
 *              email:
 *                type: string
 *              password:
 *                type: string
 *                minLength: 6
 *              confirm:
 *                type: string
 *      responses:
 *        200:
 *          $ref: '#/responses/OK'
 *        422:
 *          $ref: '#/responses/UnprocessableEntity'
 */

router.post('/', usersController.register);


/**
 * @swagger
 *
 * /users/auth:
 *   post:
 *     summary: Login to the application
 *     consumes:
 *       - application/json
 *     tags: [Users]
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: body
 *         description: user's credential
 *         schema:
 *           type: object
 *           required:
 *            - email
 *            - password
 *           properties:
 *              email:
 *                 type: string
 *              password:
 *                 type: string
 *                 example: u1234
 *     responses:
 *       200:
 *         $ref: '#/responses/OK'
 *       422:
 *         description: Validation error
 *       500:
 *         description: Server error
 *       401:
 *         description: Authorization information is missing or invalid.
 */
router.post('/auth', usersController.auth);

/**
 * @swagger
 * /users/logout:
 *    post:
 *       summary: Log out the current user
 *       security:
 *         - myCookie: []
 *       tags: [Users]
 *       responses:
 *        200:
 *          $ref: '#/responses/OK'
 */
router.post('/logout', auth.required, usersController.logout);

module.exports = router;
