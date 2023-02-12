FROM node:16.16.0-alpine3.16

WORKDIR /usr/src/app
COPY . .

RUN npm ci
CMD ["npm", "run", "start"]

