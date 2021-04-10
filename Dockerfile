FROM node:14.16.0-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build:prod

FROM nginx:1.18.0-alpine
COPY --from=build /app/dist/ng-new /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/localhost.crt /etc/nginx/localhost.crt
COPY docker/localhost.key /etc/nginx/localhost.key
