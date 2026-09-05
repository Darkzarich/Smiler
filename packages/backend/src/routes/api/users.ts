import express from 'express';
import { asyncControllerErrorHandler } from '@utils/async-controller-error-handler';
import {
  getByLogin,
  updateMe,
  updateMyAvatar,
  deleteMyAvatar,
  getMyPostTemplate,
  updateMyPostTemplate,
  getSettings,
  followById,
  unfollowById,
  deletePostTemplatePicture,
} from '@controllers/users';
import authRequiredMiddleware from '@middlewares/auth-required';
import { apiRateLimiter, uploadRateLimiter } from '@middlewares/rate-limiter';

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
          "lastLoginAt": {
            "type": "string",
            "description": "When the user last signed in, absent if they never signed in since it started being tracked"
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
            "type": "string"
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
router.get('/:login', apiRateLimiter, asyncControllerErrorHandler(getByLogin));
router.put(
  '/me',
  authRequiredMiddleware,
  apiRateLimiter,
  asyncControllerErrorHandler(updateMe),
);

/**
@swagger
{
  "/users/me/avatar": {
    "put": {
      "tags": [
        "Users"
      ],
      "summary": "Set the current user's avatar from a url",
      "description": "Downloads the picture at `url`, re-encodes it to a square jpeg and stores it on this server. The response holds the stored path, not the url that was sent.",
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
              "required": [
                "url"
              ],
              "properties": {
                "url": {
                  "type": "string",
                  "description": "Public http or https link to a jpg, jpeg, png, gif, webp or avif picture"
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
                "type": "object",
                "properties": {
                  "avatar": {
                    "type": "string",
                    "example": "/uploads/6242a0f5e1e1a1f5e1e1a1f5/3f1b0c2a-1e3d-4a5b-8c7d-9e0f1a2b3c4d.jpg"
                  }
                }
              }
            }
          }
        },
        "401": {
          "$ref": "#/components/responses/Unauthorized"
        },
        "404": {
          "$ref": "#/components/responses/NotFound"
        },
        "413": {
          "$ref": "#/components/responses/RequestEntityTooLarge"
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
      "summary": "Clear the current user's avatar",
      "security": [
        {
          "cookieAuth": []
        }
      ],
      "responses": {
        "200": {
          "description": "OK"
        },
        "401": {
          "$ref": "#/components/responses/Unauthorized"
        },
        "404": {
          "$ref": "#/components/responses/NotFound"
        }
      }
    }
  }
}
*/
router.put(
  '/me/avatar',
  authRequiredMiddleware,
  uploadRateLimiter,
  asyncControllerErrorHandler(updateMyAvatar),
);
router.delete(
  '/me/avatar',
  authRequiredMiddleware,
  apiRateLimiter,
  asyncControllerErrorHandler(deleteMyAvatar),
);

/**
@swagger
{
  "/users/me/template": {
    "get": {
      "summary": "Get current user saved template",
      "tags": [
        "Users"
      ],
      "security": [
        {
          "cookieAuth": []
        }
      ],
      "description": "Returns current user's saved template for post with `title` and `sections`",
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
        "404": {
          "$ref": "#/components/responses/NotFound"
        }
      }
    },
    "put": {
      "summary": "Update current user template",
      "tags": [
        "Users"
      ],
      "description": "Update current user post template `sections`, `title` and `tags`",
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

router.get(
  '/me/template',
  authRequiredMiddleware,
  apiRateLimiter,
  asyncControllerErrorHandler(getMyPostTemplate),
);
router.put(
  '/me/template',
  authRequiredMiddleware,
  apiRateLimiter,
  asyncControllerErrorHandler(updateMyPostTemplate),
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
  apiRateLimiter,
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
  apiRateLimiter,
  asyncControllerErrorHandler(followById),
);
router.delete(
  '/:id/follow',
  authRequiredMiddleware,
  apiRateLimiter,
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
  apiRateLimiter,
  asyncControllerErrorHandler(deletePostTemplatePicture),
);

export default router;
