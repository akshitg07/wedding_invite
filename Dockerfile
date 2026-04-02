# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/package*.json ./
RUN npm install --omit=dev

ENV PORT=8080
ENV STATE_FILE=/data/invitation-state.json
EXPOSE 8080

CMD ["npm", "run", "start"]
