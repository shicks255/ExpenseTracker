from node:22-alpine

WORKDIR /home/node/app

COPY server ./server

WORKDIR /home/node/app/server

RUN npm ci

ENV NODE_ENV=production

EXPOSE 8181

CMD ["node", "index.js"]