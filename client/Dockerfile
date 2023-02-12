FROM 16.19-alpine3.16 AS builder 
WORKDIR /usr/src/app
COPY . .
RUN npm ci
RUN npm build

FROM nginx:latest  
WORKDIR /usr/share/nginx/html
COPY --from=builder /usr/src/app .