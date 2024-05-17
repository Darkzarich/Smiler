const router = require('express').Router();
const usersController = require('../../controllers/users');
const auth = require('../auth');

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
      }
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
          "$ref": "#/components/responses/OK"
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
router.get('/:login', usersController.getUser);
router.put('/me', auth.required, usersController.updateUser);

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
                    "description": "Post sections",
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
          "$ref": "#/components/responses/OK"
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

router.get('/:login/template', auth.required, usersController.getUserPostTemplate);

router.put('/:login/template', auth.required, usersController.updateUserPostTemplate);

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

router.get('/me/settings', auth.required, usersController.getSettings);

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

router.put('/:id/follow', auth.required, usersController.follow);
router.delete('/:id/follow', auth.required, usersController.unfollow);

/**
@swagger
{
  "/users/{login}/template/{hash}": {
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
          "name": "login",
          "schema": {
            "type": "string"
          },
          "required": true,
          "description": "User name"
        },
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

router.delete('/:login/template/:hash', auth.required, usersController.deleteUserPostTemplatePicture);

module.exports = router;
