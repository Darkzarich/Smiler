import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import Config from '@config/index';
import apiRoutes from '@routes/api';

const router = express.Router();

if (!Config.IS_JEST && !Config.IS_PRODUCTION) {
  const swaggerOptions = {
    swaggerOptions: {
      withCredentials: true,
      requestInterceptor: async (request: {
        url?: string;
        method?: string;
        headers?: Record<string, string>;
        credentials?: string;
      }) => {
        request.credentials = 'include';

        const method = (request.method || 'GET').toUpperCase();

        if (['GET', 'HEAD', 'OPTIONS'].includes(method) || !request.url) {
          return request;
        }

        let csrfUrl = '/api/auth/csrf';

        if (
          request.url.startsWith('http://') ||
          request.url.startsWith('https://')
        ) {
          const url = new URL(request.url);
          const apiPathIndex = url.pathname.indexOf('/api/');
          const apiPath =
            apiPathIndex === -1
              ? '/api'
              : url.pathname.slice(0, apiPathIndex + '/api'.length);

          url.pathname = `${apiPath}/auth/csrf`;
          url.search = '';
          csrfUrl = url.toString();
        }

        const response = await fetch(csrfUrl, {
          credentials: 'include',
        });

        if (!response.ok) {
          return request;
        }

        const body = (await response.json()) as { csrfToken?: string };

        if (body.csrfToken) {
          request.headers = request.headers || {};
          request.headers['X-CSRF-Token'] = body.csrfToken;
        }

        return request;
      },
    },
  };

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

  router.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, swaggerOptions),
  );
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
        "name": "smiler.sid"
      },
      "csrfToken": {
        "type": "apiKey",
        "in": "header",
        "name": "X-CSRF-Token"
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
