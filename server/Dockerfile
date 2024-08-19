FROM node:20.16.0-alpine3.19

WORKDIR /usr/src/app

COPY . .

RUN chown -R node:node /usr/src/app

USER node

RUN npm ci --omit=dev

CMD ["npm", "run", "start"]

