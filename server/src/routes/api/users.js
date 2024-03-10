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
      "UserFollowing": {
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
          }
        }
      },
      "AuthState": {
        "type": "object",
        "properties": {
          "email": {
            "type": "string"
          },
          "login": {
            "type": "string"
          },
          "avatar": {
            "type": "string"
          },
          "isAuth": {
            "type": "boolean"
          },
          "rating": {
            "type": "number"
          },
          "followersAmount": {
            "type": "number"
          },
          "tagsFollowed": {
            "type": "array",
            "items": {
              "type": "string"
            }
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
  "/users/get-auth": {
    "get": {
      "summary": "Check login state",
      "description": "Return user auth status",
      "tags": [
        "Users"
      ],
      "responses": {
        "200": {
          "description": "OK",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/AuthState"
              }
            }
          }
        }
      }
    }
  }
}
*/
router.get('/get-auth', usersController.getAuth);

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
  }
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
  "/users/me/following": {
    "get": {
      "tags": [
        "Users"
      ],
      "summary": "Get the current user's following",
      "description": "Gets who the current user is following",
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
                "$ref": "#/components/schemas/UserFollowing"
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

router.get('/me/following', auth.required, usersController.getFollowing);

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

/**
@swagger
{
  "/users": {
    "post": {
      "summary": "Register a user",
      "tags": [
        "Users"
      ],
      "description": "Register a new user and return its cookie token (connect.sid)",
      "requestBody": {
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": [
                "login",
                "password",
                "confirm",
                "email"
              ],
              "properties": {
                "login": {
                  "type": "string",
                  "minLength": 3,
                  "maxLength": 10
                },
                "email": {
                  "type": "string"
                },
                "password": {
                  "type": "string",
                  "minLength": 6
                },
                "confirm": {
                  "type": "string"
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
                "$ref": "#/components/schemas/AuthState"
              }
            }
          },
          "headers": {
            "Set-Cookie": {
              "schema": {
                "type": "string",
                "example": "JSESSIONID=abcde12345; Path=/; HttpOnly"
              }
            }
          }
        },
        "422": {
          "$ref": "#/components/responses/UnprocessableEntity"
        }
      }
    }
  }
}
 */

router.post('/', usersController.register);


/**
@swagger
{
  "/users/auth": {
    "post": {
      "summary": "Login to the application",
      "tags": [
        "Users"
      ],
      "requestBody": {
        "description": "user's credential",
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "required": [
                "email",
                "password"
              ],
              "properties": {
                "email": {
                  "type": "string"
                },
                "password": {
                  "type": "string"
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
                "$ref": "#/components/schemas/AuthState"
              }
            }
          },
          "headers": {
            "Set-Cookie": {
              "schema": {
                "type": "string",
                "example": "JSESSIONID=abcde12345; Path=/; HttpOnly"
              }
            }
          }
        },
        "401": {
          "description": "Authorization information is missing or invalid."
        },
        "422": {
          "description": "Validation error"
        },
        "500": {
          "description": "Server error"
        }
      }
    }
  }
}
*/
router.post('/auth', usersController.auth);

/**
@swagger
{
  "/users/logout": {
    "post": {
      "summary": "Log out the current user",
      "security": [
        {
          "cookieAuth": []
        }
      ],
      "tags": [
        "Users"
      ],
      "responses": {
        "200": {
          "$ref": "#/components/responses/OK"
        }
      }
    }
  }
}
*/
router.post('/logout', auth.required, usersController.logout);

module.exports = router;
