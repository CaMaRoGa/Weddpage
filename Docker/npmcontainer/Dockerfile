FROM node:26

WORKDIR /app

COPY --chown=node:node ./package.json ./
COPY --chown=node:node ./server.js ./
COPY --chown=node:node ./public ./public

RUN chown node:node /app

USER node

RUN /usr/local/bin/npm install
CMD ["npm", "start"]
