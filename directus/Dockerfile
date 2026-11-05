FROM node:24-bookworm-slim AS extensions
WORKDIR /build
COPY directus/extensions/blueform-catalog/package*.json ./
RUN npm ci
COPY directus/extensions/blueform-catalog/src ./src
RUN npm run build

FROM directus/directus:11.14.1
COPY --from=extensions /build/package.json /directus/extensions/blueform-catalog/package.json
COPY --from=extensions /build/dist /directus/extensions/blueform-catalog/dist
COPY directus/extensions/blueform-editor-api /directus/extensions/blueform-editor-api
