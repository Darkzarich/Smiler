FROM node:16.16.0-alpine3.16

WORKDIR /usr/src/app

COPY . .

RUN chown -R node:node /usr/src/app

USER node

RUN npm ci --omit=dev

CMD ["npm", "run", "start"]

