import express from 'express';
import { asyncControllerErrorHandler } from '../../utils/async-controller-error-handler.js';
import { getList, create, updateById, deleteById, voteById, unvoteById } from '../../controllers/comments/index.js';
import authRequiredMiddleware from '../../middlewares/auth-required.js';

const router = express.Router();

/**
@swagger
{
  "tags": [
    {
      "name": "Comments",
      "description": "Actions with comments"
    }
  ],
  "components": {
    "schemas": {
      "Comment": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "post": {
            "type": "string"
          },
          "body": {
            "type": "string"
          },
          "parent": {
            "type": "string"
          },
          "author": {
            "$ref": "#/components/schemas/Author"
          },
          "createdAt": {
            "type": "string",
            "example": "2019-08-16T01:04:02.504Z"
          },
          "children": {
            "type": "array",
            "items": {
              "oneOf": [
                {
                  "$ref": "#/components/schemas/Comment"
                },
                {
                  "$ref": "#/components/schemas/CommentDeleted"
                }
              ]
            }
          },
          "rating": {
            "type": "number"
          },
          "rated": {
            "$ref": "#/components/schemas/UserRate"
          }
        }
      },
      "CommentDeleted": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "post": {
            "type": "string"
          },
          "deleted": {
            "type": "boolean"
          },
          "parent": {
            "type": "string"
          },
          "createdAt": {
            "type": "string",
            "example": "2019-08-16T01:04:02.504Z"
          },
          "children": {
            "type": "array",
            "items": {
              "oneOf": [
                {
                  "$ref": "#/components/schemas/Comment"
                },
                {
                  "$ref": "#/components/schemas/CommentDeleted"
                }
              ]
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
  "/comments": {
    "get": {
      "summary": "Get user's comments or comments in a post",
      "tags": [
        "Comments"
      ],
      "parameters": [
        {
          "in": "query",
          "name": "offset",
          "schema": {
            "default": 0,
            "type": "number"
          },
          "description": "The number of items to skip before starting to collect the result set."
        },
        {
          "in": "query",
          "name": "limit",
          "schema": {
            "default": 10,
            "maximum": 30,
            "minimum": 1,
            "type": "number"
          },
          "description": "The numbers of items to return."
        },
        {
          "in": "query",
          "name": "author",
          "schema": {
            "type": "string"
          },
          "description": "user id of the user which comments you want to see"
        },
        {
          "in": "query",
          "name": "post",
          "required": true,
          "schema": {
            "type": "string"
          },
          "description": "post id"
        }
      ],
      "responses": {
        "200": {
          "description": "OK",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "comments": {
                    "type": "array",
                    "items": {
                      "$ref": "#/components/schemas/Comment"
                    }
                  },
                  "pages": {
                    "type": "number",
                    "default": 1
                  },
                  "hasNextPage": {
                    "type": "boolean"
                  },
                  "total": {
                    "type": "number"
                  }
                }
              }
            }
          }
        },
        "404": {
          "$ref": "#/components/responses/NotFound"
        },
        "422": {
          "$ref": "#/components/responses/UnprocessableEntity"
        }
      }
    },
    "post": {
      "summary": "Create a comment",
      "tags": [
        "Comments"
      ],
      "description": "Create a comment to a post",
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
                "post"
              ],
              "properties": {
                "body": {
                  "type": "string",
                  "example": "My body is dry"
                },
                "post": {
                  "type": "string",
                  "example": "5d546c95c0f3a272b2062205"
                },
                "parent": {
                  "type": "string",
                  "example": "5d55daa034c1991762147c2b"
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
                "$ref": "#/components/schemas/Comment"
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
router.get('/', asyncControllerErrorHandler(getList));

router.post(
  '/',
  authRequiredMiddleware,
  asyncControllerErrorHandler(create),
);

/**
@swagger
{
  "/comments/{id}": {
    "put": {
      "summary": "Edit comment",
      "tags": [
        "Comments"
      ],
      "description": "Edit comment by its `id`",
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
      "requestBody": {
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "body": {
                  "type": "string"
                }
              }
            }
          }
        }
      },
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
                "$ref": "#/components/schemas/Comment"
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
    },
    "delete": {
      "tags": [
        "Comments"
      ],
      "summary": "Delete comment",
      "description": "Delete comment by its `id`",
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

router.put(
  '/:id',
  authRequiredMiddleware,
  asyncControllerErrorHandler(updateById),
);
router.delete(
  '/:id',
  authRequiredMiddleware,
  asyncControllerErrorHandler(deleteById),
);

/**
@swagger
{
  "/comments/{id}/vote": {
    "put": {
      "summary": "Change rate on comment",
      "description": "Changes rate for comment. `negative` decides direction. You can't rate comment again before deleting previous rate",
      "tags": [
        "Comments"
      ],
      "security": [
        {
          "cookieAuth": []
        }
      ],
      "parameters": [
        {
          "in": "path",
          "name": "id",
          "required": true,
          "schema": {
            "type": "string"
          }
        }
      ],
      "requestBody": {
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "negative": {
                  "type": "boolean",
                  "default": false
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
                "$ref": "#/components/schemas/Comment"
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
    "delete": {
      "summary": "Unvote a comment",
      "description": "Unvotes an already voted comment",
      "tags": [
        "Comments"
      ],
      "security": [
        {
          "cookieAuth": []
        }
      ],
      "parameters": [
        {
          "in": "path",
          "name": "id",
          "required": true,
          "schema": {
            "type": "string"
          }
        }
      ],
      "responses": {
        "200": {
          "description": "OK",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/Comment"
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
    }
  }
}
 */
router.put(
  '/:id/vote',
  authRequiredMiddleware,
  asyncControllerErrorHandler(voteById),
);
router.delete(
  '/:id/vote',
  authRequiredMiddleware,
  asyncControllerErrorHandler(unvoteById),
);

export default router;
