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
*     type: object
*     properties:
*       id:
*         type: string
*       login:
*         type: string
*         example: user123
*       rating:
*         type: number
*/

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
 *          description: ok
 *          schema:
 *             $ref: '#/definitions/OK'
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
 *              password:
 *                type: string
 *                minLength: 6
 *              confirm:
 *                type: string
 *      responses:
 *        200:
 *          description: ok
 *          schema:
 *             $ref: '#/definitions/OK'
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
 *            - login
 *            - password
 *           properties:
 *              login:
 *                 type: string
 *                 example: user123
 *              password:
 *                 type: string
 *                 example: u1234
 *     responses:
 *       200:
 *         description: OK
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
 *          200:
 *             description: OK
 */
router.post('/logout', auth.required, usersController.logout);


module.exports = router;
