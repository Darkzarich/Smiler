FROM node:20.18.3-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
WORKDIR /usr/src/app
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --config.ignore-scripts=true
RUN pnpm -r --if-present build
RUN pnpm deploy --filter "@smiler/frontend" --prod /prod/frontend
RUN pnpm deploy --filter "@smiler/backend" --prod /prod/backend

FROM base AS backend
COPY --from=build /prod/backend /prod/backend
WORKDIR /prod/backend
RUN chown -R node:node /prod/backend
USER node
CMD [ "pnpm", "start" ]

FROM nginxinc/nginx-unprivileged:alpine3.19-slim AS frontend
WORKDIR /usr/share/nginx/html
COPY --from=build /prod/frontend/dist /prod/frontend/change-api-url.sh ./
COPY --from=build /prod/frontend/nginx.conf /etc/nginx/conf.d/default.conf
USER root
RUN chown -R nginx:nginx /usr/share/nginx/html
USER nginx
EXPOSE 80
# Replacing Frontend API URL before running NGNIX
CMD . ./change-api-url.sh && nginx -g "daemon off;" 