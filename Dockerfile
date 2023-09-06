FROM node:20.4.0-alpine as builder

COPY . /app
WORKDIR /app
RUN npm ci
RUN npm run build
CMD [ "npm", "run", "start" ]