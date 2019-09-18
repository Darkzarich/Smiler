const router = require('express').Router();
const swaggerUi = require('swagger-ui-express');

const swaggerDocument = require('../swagger/swagger.json');

router.use('/api-docs', swaggerUi.serve);
router.get('/api-docs', swaggerUi.setup(swaggerDocument));
router.use('/api', require('./api'));

module.exports = router;

/**
* # Descriptions of common responses
* @swagger
* responses:
*   NotFound:
*     description: The specified resource was not found
*     schema:
*       $ref: '#/definitions/Error'
*   Unauthorized:
*     description: Unauthorized
*     schema:
*       $ref: '#/definitions/Error'
*   Forbidden:
*     description: Not enough rights
*     schema:
*       $ref: '#/definitions/Error'
*   UnprocessableEntity:
*     description: Validation error
*     schema:
*       $ref: '#/definitions/Error'
*   Conflict:
*     description: Conflict
*     schema:
*       $ref: '#/definitions/Error'
*   RequestEntityTooLarge:
*     description: Request entity too large
*     schema:
*       $ref: '#/definitions/Error'
*   InternalServerError:
*     description: Internal server error
*     schema:
*       $ref: '#/definitions/Error'
*   OK:
*     description: Everything went alright
*     schema:
*       $ref: '#/definitions/OK'
*   MethodNotAllowed:
*     description: Method is not available due to certain restrictions
*     schema:
*       $ref: '#/definitions/OK'
*
* definitions:
*   # Schema for error response body
*   Error:
*     type: object
*     properties:
*       error:
*         type: object
*         properties:
*           message:
*             type: string
*     required:
*       - message
*   OK:
*     type: object
*     properties:
*       ok:
*         type: boolean
*         example: true
*/
