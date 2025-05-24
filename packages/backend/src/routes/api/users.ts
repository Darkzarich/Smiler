import express from 'express';
import { asyncControllerErrorHandler } from '@utils/async-controller-error-handler';
import {
  getByLogin,
  updateMe,
  getPostTemplate,
  updatePostTemplate,
  getSettings,
  followById,
  unfollowById,
  deletePostTemplatePicture,
} from '@controllers/users';
import authRequiredMiddleware from '@middlewares/auth-required';

const router = express.Router();
/**
@swagger
{
  "tags": [
    {
      "name": "Users",
      "description": "Actions with Users collection"
    }
  ],
  "components": {
    "schemas": {
      "Author": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "login": {
            "type": "string",
            "example": "user123"
          },
          "avatar": {
            "type": "string"
          }
        }
      },
      "UserProfile": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "login": {
            "type": "string"
          },
          "rating": {
            "type": "number"
          },
          "bio": {
            "type": "string"
          },
          "avatar": {
            "type": "string"
          },
          "createdAt": {
            "type": "string"
          },
          "followersAmount": {
            "type": "number"
          },
          "isFollowed": {
            "type": "boolean",
            "default": false
          }
        }
      },
      "UserSettings": {
        "type": "object",
        "properties": {
          "tags": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "authors": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Author"
            }
          },
          "bio": {
            "type": "string"
          },
          "avatar": {
            "type": string
          }
        }
      },
      PostTemplate: {
        "type": "object",
        "properties": {
          "title": {
            "type": "string"
          },
          "tags": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "sections": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/PostSection"
            }
          }
        }
      },
    }
  }
}
*/

/**
@swagger
{
  "/users/{login}": {
    "get": {
      "tags": [
        "Users"
      ],
      "summary": "Get user profile",
      "description": "Get user profile",
      "parameters": [
        {
          "in": "path",
          "name": "login",
          "schema": {
            "type": "string"
          },
          "required": true
        }
      ],
      "responses": {
        "200": {
          "description": "OK",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/UserProfile"
              }
            }
          }
        },
        "404": {
          "$ref": "#/components/responses/NotFound"
        }
      }
    },
  },
  "/users/me": {
    "put": {
      "tags": [
        "Users"
      ],
      "summary": "Update user info",
      "description": "Update user info with payload",
      "security": [
        {
          "cookieAuth": []
        }
      ],
      "requestBody": {
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "bio": {
                  "type": "string",
                  "maxLength": 300
                },
                "avatar": {
                  "type": "string",
                  "maxLength": 150,
                  "description": "URL"
                }
              }
            }
          }
        }
      },
      "responses": {
        "200": {
          "description": "OK",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/UserProfile"
              }
            }
          }
        },
        "401": {
          "$ref": "#/components/responses/Unauthorized"
        },
        "403": {
          "$ref": "#/components/responses/Forbidden"
        },
        "404": {
          "$ref": "#/components/responses/NotFound"
        },
        "422": {
          "$ref": "#/components/responses/UnprocessableEntity"
        }
      }
    }
  }
}
*/
router.get('/:login', asyncControllerErrorHandler(getByLogin));
router.put(
  '/me',
  authRequiredMiddleware,
  asyncControllerErrorHandler(updateMe),
);

/**
@swagger
{
  "/users/{id}/template": {
    "get": {
      "summary": "Get user saved template",
      "tags": [
        "Users"
      ],
      "security": [
        {
          "cookieAuth": []
        }
      ],
      "description": "Returns user's saved template for post with `title` and `sections`",
      "parameters": [
        {
          "in": "path",
          "name": "id",
          "schema": {
            "type": "string"
          },
          "required": true,
          "description": "User id"
        }
      ],
      "responses": {
        "200": {
          "description": "ok",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/PostTemplate"
              }
            }
          }
        },
        "401": {
          "$ref": "#/components/responses/Unauthorized"
        },
        "403": {
          "$ref": "#/components/responses/Forbidden"
        }
      }
    },
    "put": {
      "summary": "Update user template",
      "tags": [
        "Users"
      ],
      "description": "Update user post template `sections`, `title` and `tags`",
      "security": [
        {
          "cookieAuth": []
        }
      ],
      "parameters": [
        {
          "in": "path",
          "name": "id",
          "schema": {
            "type": "string"
          },
          "required": true,
          "description": "User id"
        }
      ],
      "requestBody": {
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "title": {
                  "type": "string"
                },
                "tags": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                },
                "sections": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/PostSection"
                  }
                }
              }
            }
          }
        }
      },
      "responses": {
        "200": {
          "description": "OK",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/PostTemplate"
              }
            }
          }
        },
        "401": {
          "$ref": "#/components/responses/Unauthorized"
        },
        "403": {
          "$ref": "#/components/responses/Forbidden"
        },
        "422": {
          "$ref": "#/components/responses/UnprocessableEntity"
        }
      }
    }
  }
}
*/

// TODO: me/template
router.get(
  '/:id/template',
  authRequiredMiddleware,
  asyncControllerErrorHandler(getPostTemplate),
);
router.put(
  '/:id/template',
  authRequiredMiddleware,
  asyncControllerErrorHandler(updatePostTemplate),
);

/**
@swagger
{
  "/users/me/settings": {
    "get": {
      "tags": [
        "Users"
      ],
      "summary": "Get the current user's settings",
      "description": "Gets the current user's settings: bio, followed users, tags etc",
      "security": [
        {
          "cookieAuth": []
        }
      ],
      "responses": {
        "200": {
          "description": "OK",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/UserSettings"
              }
            }
          }
        },
        "401": {
          "$ref": "#/components/responses/Unauthorized"
        },
        "403": {
          "$ref": "#/components/responses/Forbidden"
        },
        "404": {
          "$ref": "#/components/responses/NotFound"
        }
      }
    }
  }
}
 */

router.get(
  '/me/settings',
  authRequiredMiddleware,
  asyncControllerErrorHandler(getSettings),
);

/**
@swagger
{
  "/users/{id}/follow": {
    "put": {
      "tags": [
        "Users"
      ],
      "summary": "Follow a user",
      "description": "Follow a user",
      "parameters": [
        {
          "in": "path",
          "name": "id",
          "schema": {
            "type": "string"
          },
          "required": true
        }
      ],
      "security": [
        {
          "cookieAuth": []
        }
      ],
      "responses": {
        "200": {
          "$ref": "#/components/responses/OK"
        },
        "401": {
          "$ref": "#/components/responses/Unauthorized"
        },
        "404": {
          "$ref": "#/components/responses/NotFound"
        },
        "422": {
          "$ref": "#/components/responses/UnprocessableEntity"
        }
      }
    },
    "delete": {
      "tags": [
        "Users"
      ],
      "summary": "Unfollow a user",
      "description": "Unfollow a user",
      "parameters": [
        {
          "in": "path",
          "name": "id",
          "schema": {
            "type": "string"
          },
          "required": true
        }
      ],
      "security": [
        {
          "cookieAuth": []
        }
      ],
      "responses": {
        "200": {
          "$ref": "#/components/responses/OK"
        },
        "401": {
          "$ref": "#/components/responses/Unauthorized"
        },
        "404": {
          "$ref": "#/components/responses/NotFound"
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
  '/:id/follow',
  authRequiredMiddleware,
  asyncControllerErrorHandler(followById),
);
router.delete(
  '/:id/follow',
  authRequiredMiddleware,
  asyncControllerErrorHandler(unfollowById),
);

/**
@swagger
{
  "/users/me/template/{hash}": {
    "delete": {
      "tags": [
        "Users"
      ],
      "summary": "Delete section file picture",
      "description": "Deletes file picture section and the image from the server. Works only for sections with `isFile` set as true",
      "security": [
        {
          "cookieAuth": []
        }
      ],
      "parameters": [
        {
          "in": "path",
          "name": "hash",
          "schema": {
            "type": "string"
          },
          "required": true,
          "description": "Section hash"
        }
      ],
      "responses": {
        "200": {
          "$ref": "#/components/responses/OK"
        },
        "400": {
          "$ref": "#/components/responses/Unauthorized"
        },
        "401": {
          "$ref": "#/components/responses/Unauthorized"
        },
        "404": {
          "$ref": "#/components/responses/NotFound"
        },
        "422": {
          "$ref": "#/components/responses/UnprocessableEntity"
        }
      }
    }
  }
}
*/

router.delete(
  '/me/template/:hash',
  authRequiredMiddleware,
  asyncControllerErrorHandler(deletePostTemplatePicture),
);

export default router;
