import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import Config from '@config/index';
import apiRoutes from '@routes/api';

const router = express.Router();

if (!Config.IS_JEST) {
  const swaggerSpec = swaggerJSDoc({
    apis: ['./src/routes/**/*.ts'],
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Smiler Api', // Title (required)
        version: '1.0.0', // Version (required)
        // Description (optional)
        description:
          'Smiler is my own MEVN (MongoDB, Express, Vue.js, Node.js) site similar to reddit.com or 9gag.com (mostly takes many known features) with many different and awesome features, open Swagger API docs, tests, interesting tools and more. Main reason of making this site is fun and learning new things while making it',
      },
      servers: [
        {
          url: 'https://smiler-api.darkzarich.com/api',
          description: 'Production server',
        },
        {
          url: 'http://localhost:3000/api',
          description: 'Local server',
        },
      ],
    },
  });

  router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

router.use('/api', apiRoutes);

export default router;

/**
# Descriptions of common responses
@swagger
{
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
}
*/
