import express from 'express';
import { asyncControllerErrorHandler } from '@utils/async-controller-error-handler';
import { follow, unfollow } from '@controllers/tags';
import authRequiredMiddleware from '@middlewares/auth-required';

const router = express.Router();
/**
@swagger
{
  "/tags/{tag}/follow": {
    "put": {
      "tags": [
        "Tags"
      ],
      "summary": "Follow the tag",
      "security": [
        {
          "cookieAuth": []
        }
      ],
      "parameters": [
        {
          "in": "path",
          "name": "tag",
          "required": true,
          "schema": {
            "type": "string"
          }
        }
      ],
      "responses": {
        "200": {
          "$ref": "#/components/responses/OK"
        },
        "401": {
          "$ref": "#/components/responses/Unauthorized"
        },
        "422": {
          "$ref": "#/components/responses/UnprocessableEntity"
        }
      }
    },
    "delete": {
      "tags": [
        "Tags"
      ],
      "summary": "Unfollow the tag",
      "security": [
        {
          "cookieAuth": []
        }
      ],
      "parameters": [
        {
          "in": "path",
          "name": "tag",
          "required": true,
          "schema": {
            "type": "string"
          }
        }
      ],
      "responses": {
        "200": {
          "$ref": "#/components/responses/OK"
        },
        "401": {
          "$ref": "#/components/responses/Unauthorized"
        },
        "422": {
          "$ref": "#/components/responses/UnprocessableEntity"
        }
      }
    }
  }
}
*/

router.put(
  '/:tag/follow',
  authRequiredMiddleware,
  asyncControllerErrorHandler(follow),
);
router.delete(
  '/:tag/follow',
  authRequiredMiddleware,
  asyncControllerErrorHandler(unfollow),
);

export default router;
