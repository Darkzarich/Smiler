const router = require('express').Router();
const swaggerUi = require('swagger-ui-express');

const swaggerDocument = require('../swagger/swagger.json');

router.use('/api-docs', swaggerUi.serve);
router.get('/api-docs', swaggerUi.setup(swaggerDocument));
router.use('/api', require('./api'));

module.exports = router;

/**
# Descriptions of common responses
@swagger
"components": {
    "securitySchemes": {
      "cookieAuth": {
        
        "type": "apiKey",
        "in": "cookie",
        "name": "JSESSIONID"
      }
    },
    "schemas": {
      "Error": {
        "type": "object",
        "properties": {
          "error": {
            "type": "object",
            "properties": {
              "message": {
                "type": "string"
              }
            }
          }
        },
        "required": [
          "message"
        ]
      },
      "OK": {
        "type": "object",
        "properties": {
          "ok": {
            "type": "boolean",
            "example": true
          }
        }
      }
    },
    "responses": {
      "NotFound": {
        "description": "The specified resource was not found",
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/Error"
            }
          }
        }
      },
      "Unauthorized": {
        "description": "Unauthorized",
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/Error"
            }
          }
        }
      },
      "Forbidden": {
        "description": "Not enough rights",
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/Error"
            }
          }
        }
      },
      "UnprocessableEntity": {
        "description": "Validation error",
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/Error"
            }
          }
        }
      },
      "Conflict": {
        "description": "Conflict",
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/Error"
            }
          }
        }
      },
      "RequestEntityTooLarge": {
        "description": "Request entity too large",
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/Error"
            }
          }
        }
      },
      "InternalServerError": {
        "description": "Internal server error",
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/Error"
            }
          }
        }
      },
      "OK": {
        "description": "Everything went alright",
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/OK"
            }
          }
        }
      },
      "MethodNotAllowed": {
        "description": "Method is not available due to certain restrictions",
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/Error"
            }
          }
        }
      }
    }
  }
*/
