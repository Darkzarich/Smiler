FROM node:16.16.0-alpine3.16

WORKDIR /usr/src/app

COPY . .

RUN npm ci --omit=dev

CMD ["npm", "run", "start"]

