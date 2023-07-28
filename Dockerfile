FROM node:lts-alpine
WORKDIR /app
COPY package.json ./
COPY yarn.lock ./
RUN yarn install
COPY . .
EXPOSE 8080
RUN yarn nest build
CMD ["yarn", "dev"]
