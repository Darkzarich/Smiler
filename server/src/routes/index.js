import express from 'express';
import { serve, setup } from 'swagger-ui-express';
import { createRequire } from 'node:module';
import apiRoutes from './api/index.js';
import Config from '../config/index.js';

const router = express.Router();

if (!Config.IS_JEST) {
  const require = createRequire(import.meta.url);
  const swaggerDocument = require('../swagger/swagger.json');

  router.use('/api-docs', serve, setup(swaggerDocument));
}

router.use('/api', apiRoutes);

export default router;

/**
# Descriptions of common responses
@swagger
"components": {
    "securitySchemes": {
      "cookieAuth": {
        
        "type": "apiKey",
        "in": "cookie",
        "name": "connect.sid"
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
              },
              "code": {
                "type": "string"
              },
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
      }
    }
  }
*/
