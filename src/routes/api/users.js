const router = require('express').Router();
const usersController = require('../../controllers/users');
const auth = require('../auth');

/**
   * @swagger
   * tags:
   *   - name: Users
   *     description: Actions with Users collection
   */

router.get('/:login/template', auth.required, usersController.getUserPostTemplate);

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
 *         name: user
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

router.put('/:login/template', auth.required, usersController.updateUserPostTemplate);


module.exports = router;
