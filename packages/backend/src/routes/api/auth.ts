import express from 'express';
import { asyncControllerErrorHandler } from '@utils/async-controller-error-handler';
import { current, signIn, signUp, logout } from '@controllers/auth';
import authRequiredMiddleware from '@middlewares/auth-required';

const router = express.Router();

/**
@swagger
{
  "tags": [
    {
      "name": "Auth",
      "description": "Actions related to user authentication"
    }
  ],
  "components": {
    "schemas": {
      "AuthState": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
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
  "/auth/current": {
    "get": {
      "summary": "Check login state",
      "description": "Return user auth status",
      "tags": [
        "Auth"
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
router.get('/current', asyncControllerErrorHandler(current));

/**
@swagger
{
  "/auth/signin": {
    "post": {
      "summary": "Sign in to the application",
      "tags": [
        "Auth"
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
router.post('/signin', asyncControllerErrorHandler(signIn));

/**
@swagger
{
  "/auth/signup": {
    "post": {
      "summary": "Sign up a user",
      "tags": [
        "Auth"
      ],
      "description": "Sign up a new user and return its cookie token (connect.sid)",
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
router.post('/signup', asyncControllerErrorHandler(signUp));

/**
@swagger
{
  "/auth/logout": {
    "post": {
      "summary": "Log out the current user",
      "security": [
        {
          "cookieAuth": []
        }
      ],
      "tags": [
        "Auth"
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
router.post(
  '/logout',
  authRequiredMiddleware,
  asyncControllerErrorHandler(logout),
);

export default router;
