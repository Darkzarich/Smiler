const router = require('express').Router();
const {
  asyncControllerErrorHandler,
} = require('../../utils/async-controller-error-handler');
const usersController = require('../../controllers/users');
const authRequiredMiddleware = require('../../middlewares/auth-required');

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
          "followersCount": {
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
router.get('/:login', asyncControllerErrorHandler(usersController.getByLogin));
router.put(
  '/me',
  authRequiredMiddleware,
  asyncControllerErrorHandler(usersController.updateMe),
);

/**
@swagger
{
  "/users/{login}/template": {
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
          "name": "login",
          "schema": {
            "type": "string"
          },
          "required": true,
          "description": "User name"
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
          "name": "login",
          "schema": {
            "type": "string"
          },
          "required": true,
          "description": "User name"
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

router.get(
  '/:login/template',
  authRequiredMiddleware,
  asyncControllerErrorHandler(usersController.getPostTemplate),
);
router.put(
  '/:login/template',
  authRequiredMiddleware,
  asyncControllerErrorHandler(usersController.updatePostTemplate),
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
  asyncControllerErrorHandler(usersController.getSettings),
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
  asyncControllerErrorHandler(usersController.followById),
);
router.delete(
  '/:id/follow',
  authRequiredMiddleware,
  asyncControllerErrorHandler(usersController.unfollowById),
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
  asyncControllerErrorHandler(usersController.deletePostTemplatePicture),
);

module.exports = router;
