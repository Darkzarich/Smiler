import express from 'express';
import swaggerUi from 'swagger-ui-express';
import Config from '@config/index';
import { buildOpenApiDocument } from '@libs/openapi/document';
import apiRoutes from '@routes/api';

const router = express.Router();

router.use('/api', apiRoutes);

if (!Config.IS_JEST && !Config.IS_PRODUCTION) {
  // Built after the routes are mounted above, which is what registers them.
  const openApiDocument = buildOpenApiDocument();

  const swaggerOptions = {
    swaggerOptions: {
      withCredentials: true,
      /**
       * "Try it out" sends a real request, and every unsafe one needs the CSRF
       * token of the session the browser already has. Fetching it here means
       * the docs work without the reader pasting a token into a header by hand.
       */
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

  // The document itself, for anything that reads a spec rather than a page:
  // client generators, linters, diffing it against the last release.
  router.get('/api-docs/openapi.json', (_req, res) => {
    res.json(openApiDocument);
  });

  router.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, swaggerOptions),
  );
}

export default router;
