# WHY: Railway's Nixpacks builder fails intermittently on apt package installs.
# A Dockerfile gives us full control over the build process.

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
# WHY: Only install production deps for the final image — keeps it small
RUN npm ci --omit=dev
COPY server.js .
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "server.js"]
