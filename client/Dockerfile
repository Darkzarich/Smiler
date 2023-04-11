# Step 1

FROM node:16.16.0-alpine3.16 AS builder 

WORKDIR /usr/src/app

COPY . .

RUN npm ci
RUN npm run build

# Step 2

FROM nginx:1.22.1 

EXPOSE 80  

WORKDIR /usr/share/nginx/html

COPY --from=builder /usr/src/app/dist .
COPY --from=builder /usr/src/app/change-api-url.sh .
COPY --from=builder /usr/src/app/nginx.conf /etc/nginx/conf.d/default.conf

# Replace Frontend API URL before running NGNIX

CMD . ./change-api-url.sh && nginx -g "daemon off;"