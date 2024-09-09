import express from 'express';
import { asyncControllerErrorHandler } from '../../utils/async-controller-error-handler.js';
import { getListByAuthor, search, create, all, today, blowing, recent, topThisWeek, getFeed, getBySlug, updateById, deleteById, upload, voteById, unvoteById } from '../../controllers/posts/index.js';
import authRequiredMiddleware from '../../middlewares/auth-required.js';

const router = express.Router();

/**
@swagger
{
  "tags": [
    {
      "name": "Posts",
      "description": "Actions with posts"
    }
  ],
  "components": {
    "parameters": {
      "post-limit": {
        "description": "posts per page",
        "in": "query",
        "name": "limit",
        "required": true,
        "schema": {
          "type": "number",
          "default": 15,
          "maximum": 15,
          "minimum": 1
        }
      },
      "post-offset": {
        "description": "offset from element",
        "in": "query",
        "name": "offset",
        "required": true,
        "schema": {
          "type": "number",
          "default": 0
        }
      }
    },
    "schemas": {
      "Post": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "commentCount": {
            "description": "number of comments in a post",
            "type": "number"
          },
          "title": {
            "type": "string"
          },
          "sections": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/PostSection"
            }
          },
          "author": {
            "$ref": "#/components/schemas/Author"
          },
          "slug": {
            "type": "string",
            "example": "My-post-title-d2k5g8"
          },
          "createdAt": {
            "type": "string",
            "example": "2019-08-21T22:05:44.788Z"
          },
          "updatedAt": {
            "type": "string",
            "example": "2019-09-22T14:02:14.532Z"
          },
          "rating": {
            "type": "number"
          },
          "tags": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "rated": {
            "$ref": "#/components/schemas/UserRate"
          }
        }
      },
      "PostList": {
        "type": "object",
        "properties": {
          "posts": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Post"
            }
          },
          "pages": {
            "type": "number"
          },
          "hasNextPage": {
            "type": "boolean"
          },
          "total": {
            "type": "number"
          }
        }
      },
      "UserRate": {
        "type": "object",
        "properties": {
          "isRated": {
            "type": "boolean"
          },
          "negative": {
            "type": "boolean"
          }
        }
      },
      "PostSection": {
        "oneOf": [
          {
            "$ref": "#/components/schemas/PostSectionText"
          },
          {
            "$ref": "#/components/schemas/PostSectionImage"
          },
          {
            "$ref": "#/components/schemas/PostSectionVideo"
          }
        ]
      },
      "PostSectionText": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "enum": [
              "text"
            ]
          },
          "content": {
            "type": "string",
            "maxLength": 4500
          },
          "hash": {
            "type": "string"
          }
        }
      },
      "PostSectionImage": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "enum": [
              "pic"
            ]
          },
          "url": {
            "type": "string"
          },
          "hash": {
            "type": "string"
          },
          "isFile": {
            "type": "boolean",
            "default": false
          }
        }
      },
      "PostSectionVideo": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "enum": [
              "vid"
            ]
          },
          "url": {
            "type": "string"
          },
          "hash": {
            "type": "string"
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
  "/posts": {
    "get": {
      "tags": [
        "Posts"
      ],
      "description": "Get all posts",
      "summary": "Get all posts",
      "parameters": [
        {
          "$ref": "#/components/parameters/post-limit"
        },
        {
          "$ref": "#/components/parameters/post-offset"
        },
        {
          "in": "query",
          "name": "tags",
          "schema": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "explode": true
        },
        {
          "in": "query",
          "name": "author",
          "schema": {
            "type": "string"
          },
          "description": "By author"
        },
        {
          "in": "query",
          "name": "title",
          "description": "Search post by title",
          "schema": {
            "type": "string"
          }
        },
        {
          "in": "query",
          "name": "dateFrom",
          "description": "Show posts posted after `dateFrom`",
          "schema": {
            "type": "string"
          },
          "example": "2019-08-21T22:05:44.788Z"
        },
        {
          "in": "query",
          "name": "dateTo",
          "description": "Show posts posted before `dateTo`",
          "schema": {
            "type": "string"
          },
          "example": "2019-09-21T22:05:44.788Z"
        },
        {
          "in": "query",
          "name": "ratingFrom",
          "description": "Show posts posted with rating above `ratingFrom`",
          "schema": {
            "type": "string"
          }
        },
        {
          "in": "query",
          "name": "ratingTo",
          "description": "Show posts posted with rating below `ratingTo`",
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
                "$ref": "#/components/schemas/PostList"
              }
            }
          }
        }
      }
    },
    "post": {
      "tags": [
        "Posts"
      ],
      "description": "Create a post with `title` and `sections`. Creating a post clears the template.",
      "summary": "create a post",
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
                "title",
                "sections"
              ],
              "properties": {
                "title": {
                  "type": "string"
                },
                "sections": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/PostSection"
                  }
                },
                "tags": {
                  "type": "array",
                  "items": {
                    "type": "string"
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
                "$ref": "#/components/schemas/Post"
              }
            }
          }
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
router.get(
  '/',
  asyncControllerErrorHandler((req, res) => {
    if (req.query.author) {
      return getListByAuthor(req, res);
    }

    return search(req, res);
  }),
);

router.post(
  '/',
  authRequiredMiddleware,
  asyncControllerErrorHandler(create),
);

/**
@swagger
{
  "/posts/categories/all": {
    "get": {
      "tags": [
        "Posts"
      ],
      "description": "Get all posts sorted by rating",
      "summary": "Get posts",
      "parameters": [
        {
          "$ref": "#/components/parameters/post-limit"
        },
        {
          "$ref": "#/components/parameters/post-offset"
        },
      ],
      "responses": {
        "200": {
          "description": "OK",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/PostList"
              }
            }
          }
        },
      }
    }
  }
}
*/

router.get('/categories/all', asyncControllerErrorHandler(all));

/**
@swagger
{
  "/posts/categories/today": {
    "get": {
      "tags": [
        "Posts"
      ],
      "description": "Get today's posts sorted by rating",
      "summary": "Get today's posts",
      "parameters": [
        {
          "$ref": "#/components/parameters/post-limit"
        },
        {
          "$ref": "#/components/parameters/post-offset"
        },
      ],
      "responses": {
        "200": {
          "description": "OK",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/PostList"
              }
            }
          }
        },
      }
    }
  }
}
*/

router.get(
  '/categories/today',
  asyncControllerErrorHandler(today),
);

/**
@swagger
{
  "/posts/categories/blowing": {
    "get": {
      "tags": [
        "Posts"
      ],
      "description": "Get posts posted in the last hour and with rating 50 or more, sorted by rating",
      "summary": "Get blowing posts",
      "parameters": [
        {
          "$ref": "#/components/parameters/post-limit"
        },
        {
          "$ref": "#/components/parameters/post-offset"
        },
      ],
      "responses": {
        "200": {
          "description": "OK",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/PostList"
              }
            }
          }
        },
      }
    }
  }
}
*/

router.get(
  '/categories/blowing',
  asyncControllerErrorHandler(blowing),
);

/**
@swagger
{
  "/posts/categories/recent": {
    "get": {
      "tags": [
        "Posts"
      ],
      "description": "Get posts posted in the last two hours, sorted by the date of creation",
      "summary": "Get recent posts",
      "parameters": [
        {
          "$ref": "#/components/parameters/post-limit"
        },
        {
          "$ref": "#/components/parameters/post-offset"
        },
      ],
      "responses": {
        "200": {
          "description": "OK",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/PostList"
              }
            }
          }
        },
      }
    }
  }
}
*/

router.get(
  '/categories/recent',
  asyncControllerErrorHandler(recent),
);

/**
@swagger
{
  "/posts/categories/top-this-week": {
    "get": {
      "tags": [
        "Posts"
      ],
      "description": "Get posts posted from the start of the week, sorted by the date of creation",
      "summary": "Get top posts",
      "parameters": [
        {
          "$ref": "#/components/parameters/post-limit"
        },
        {
          "$ref": "#/components/parameters/post-offset"
        },
      ],
      "responses": {
        "200": {
          "description": "OK",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/PostList"
              }
            }
          }
        },
      }
    }
  }
}
*/

router.get(
  '/categories/top-this-week',
  asyncControllerErrorHandler(topThisWeek),
);

/**
@swagger
{
  "/posts/feed": {
    "get": {
      "tags": [
        "Posts"
      ],
      "description": "Get feed",
      "summary": "Get feed",
      "parameters": [
        {
          "$ref": "#/components/parameters/post-limit"
        },
        {
          "$ref": "#/components/parameters/post-offset"
        },
      ],
      "responses": {
        "200": {
          "description": "OK",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/PostList"
              }
            }
          }
        },
        "401": {
          "$ref": "#/components/responses/Unauthorized"
        }
      }
    }
  }
}
*/

router.get(
  '/feed',
  authRequiredMiddleware,
  asyncControllerErrorHandler(getFeed),
);

/**
@swagger
{
  "/posts/{id}": {
    "put": {
      "tags": [
        "Posts"
      ],
      "security": [
        {
          "cookieAuth": []
        }
      ],
      "description": "Edit a post. You can edit a post only within certain time after it is created",
      "summary": "edit a post",
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
                "$ref": "#/components/schemas/Post"
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
    },
    "delete": {
      "tags": [
        "Posts"
      ],
      "summary": "delete a post by its Id",
      "description": "delete a post by its `Id`",
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
  },
  "/posts/{slug}": {
    "get": {
      "tags": [
        "Posts"
      ],
      "summary": "get a post by its slug",
      "description": "Get a post by its `slug`",
      "parameters": [
        {
          "in": "path",
          "name": "slug",
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
                "$ref": "#/components/schemas/Post"
              }
            }
          }
        },
        "404": {
          "$ref": "#/components/responses/NotFound"
        }
      }
    }
  }
}
*/
router.get('/:slug', asyncControllerErrorHandler(getBySlug));
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
  "/posts/upload": {
    "post": {
      "tags": [
        "Posts"
      ],
      "summary": "upload picture",
      "description": "Upload the picture to template. Allowed extensions: `jpg|jpeg|png|gif`",
      "security": [
        {
          "cookieAuth": []
        }
      ],
      "requestBody": {
        "content": {
          "multipart/form-data": {
            "schema": {
              "type": "object",
              "properties": {
                "picture": {
                  "type": "string",
                  "format": "binary"
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
                "$ref": "#/components/schemas/PostSectionImage"
              }
            }
          }
        },
        "401": {
          "$ref": "#/components/responses/Unauthorized"
        },
        "409": {
          "$ref": "#/components/responses/Conflict"
        },
        "413": {
          "$ref": "#/components/responses/RequestEntityTooLarge"
        },
        "422": {
          "$ref": "#/components/responses/UnprocessableEntity"
        },
        "500": {
          "$ref": "#/components/responses/InternalServerError"
        }
      }
    }
  }
}
 */
router.post(
  '/upload',
  authRequiredMiddleware,
  asyncControllerErrorHandler(upload),
);

/**
@swagger
{
  "/posts/{id}/vote": {
    "put": {
      "summary": "Vote for a post", 
      "description": "Changes vote for post. `negative` decides direction. Cannot rate the post again before deleting previous rate",
      "tags": [
        "Posts"
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
                "$ref": "#/components/schemas/Post"
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
      "summary": "Unvote a post",
      "description": "Delete already existing rate for user for post",
      "tags": [
        "Posts"
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
                "$ref": "#/components/schemas/Post"
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
