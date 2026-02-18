FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
COPY apps/gateway/package*.json ./apps/gateway/
RUN npm install

COPY . .

ENV PORT=8787
ENV ENGINE_HTTP_BASE=http://engine:8000
ENV ENGINE_WS_BASE=ws://engine:8000/ws

EXPOSE 8787
CMD ["node", "apps/gateway/src/server.js"]
